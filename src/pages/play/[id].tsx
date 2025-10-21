import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import CanvasField, { CanvasHandle } from '../../components/CanvasField';
import SlideControls from '../../components/SlideControls';
import PlayPreview from '../../components/PlayPreview';
import ExportButtons from '../../components/ExportButtons';
import AIAssistant from '../../components/AIAssistant';
import PlayGeneratorModal from '../../components/PlayGeneratorModal';
import RedTeamPanel from '../../components/RedTeamPanel';
import {
  Play,
  Route,
  Slide,
  PlayerPosition,
  BallMarker,
  EndpointMarker,
  DefensiveScheme,
  GeneratedPlay,
  DefensivePlayer
} from '../../types';
import { FIELD, snapToGrid, snapToLOS } from '../../lib/formations';
import { getOrCreateUserProfile } from '../../lib/user';
import { generatePlayFromEndpoint, challengePlayWithRedTeam } from '../../lib/ai';

export default function PlayEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [play, setPlay] = useState<Play | null>(null);
  const [slideIndex, setSlideIndex] = useState<number>(1);
  const [role, setRole] = useState<'coach' | 'player'>('player');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playName, setPlayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [routeColor, setRouteColor] = useState('#FF6B6B');
  const [showGrid, setShowGrid] = useState(true);
  const [enableSnapping, setEnableSnapping] = useState(true);
  const canvasRef = useRef<CanvasHandle>(null);

  // AI Play Generator states
  const [isGeneratorMode, setIsGeneratorMode] = useState(false);
  const [ballMarker, setBallMarker] = useState<BallMarker | null>(null);
  const [endpointMarker, setEndpointMarker] = useState<EndpointMarker | null>(null);
  const [generatorStep, setGeneratorStep] = useState<'place-ball' | 'place-endpoint' | 'select-type'>('place-ball');
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  // Red Team Challenge states
  const [isRedTeamActive, setIsRedTeamActive] = useState(false);
  const [defensiveScheme, setDefensiveScheme] = useState<DefensiveScheme | null>(null);
  const [isLoadingDefense, setIsLoadingDefense] = useState(false);
  const [showDefensiveAssignments, setShowDefensiveAssignments] = useState(true);

  // Allow anyone who owns the play to edit it (both coaches and players)
  const canEdit = auth.currentUser && play && play.createdBy === auth.currentUser.uid;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // Fetch play
        const snap = await getDoc(doc(db, 'plays', id));
        if (snap.exists()) {
          const playData = { id: snap.id, ...(snap.data() as Omit<Play, 'id'>) } as Play;
          setPlay(playData);
          setPlayName(playData.name);
        } else {
          alert('Play not found');
          navigate('/');
        }

        // Fetch user role
        if (auth.currentUser) {
          const profile = await getOrCreateUserProfile();
          setRole(profile.role);
        }
      } catch (error) {
        console.error('Error fetching play:', error);
        alert('Error loading play');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const updatePosition = async (playerId: string, x: number, y: number) => {
    if (!play || !canEdit) return;

    const updatedSlides = play.slides.map(s =>
      s.index === slideIndex
        ? { ...s, positions: s.positions.map(p => p.id === playerId ? { ...p, x, y } : p) }
        : s
    );

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    // Auto-save position changes
    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error saving position:', error);
    } finally {
      setSaving(false);
    }
  };

  const renamePosition = async (playerId: string, label: string) => {
    if (!play || !canEdit) return;

    const updatedSlides = play.slides.map(s => ({
      ...s,
      positions: s.positions.map(p => p.id === playerId ? { ...p, label } : p)
    }));

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error saving label:', error);
    } finally {
      setSaving(false);
    }
  };

  const mirrorLeftRight = async () => {
    if (!play || !canEdit) return;

    const w = FIELD.width;
    const updated = play.slides.map(s => ({
      ...s,
      positions: s.positions.map(p => ({ ...p, x: w - p.x }))
    }));

    const np = { ...play, slides: updated };
    setPlay(np);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updated });
    } catch (error) {
      console.error('Error mirroring play:', error);
    } finally {
      setSaving(false);
    }
  };

  const flipField = async () => {
    if (!play || !canEdit) return;

    const h = FIELD.height;
    const updated = play.slides.map(s => ({
      ...s,
      positions: s.positions.map(p => ({ ...p, y: h - p.y }))
    }));

    const np = { ...play, slides: updated };
    setPlay(np);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updated });
    } catch (error) {
      console.error('Error flipping play:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSnapToLOS = async () => {
    if (!play || !canEdit) return;

    // Apply snapToLOS to all slides
    const updated = play.slides.map(s => ({
      ...s,
      positions: snapToLOS(s.positions)
    }));

    const np = { ...play, slides: updated };
    setPlay(np);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updated });
    } catch (error) {
      console.error('Error snapping to LOS:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNameSave = async (newName?: string) => {
    const nameToSave = newName || playName;
    if (!play || !canEdit || !nameToSave.trim()) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { name: nameToSave });
      setPlay({ ...play, name: nameToSave });
      setPlayName(nameToSave);
      setIsEditingName(false);
    } catch (error) {
      console.error('Error saving name:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!play || !canEdit) return;

    if (confirm('Are you sure you want to delete this play? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'plays', play.id));
        navigate('/');
      } catch (error) {
        console.error('Error deleting play:', error);
        alert('Failed to delete play');
      }
    }
  };

  // Route Drawing Functions
  const startDrawingRoute = () => {
    if (!canEdit) return;
    setIsDrawingRoute(true);
    setSelectedPlayerId(null);
    setCurrentRoute(null);
  };

  const stopDrawingRoute = () => {
    setIsDrawingRoute(false);
    setSelectedPlayerId(null);
    setCurrentRoute(null);
  };

  const handlePlayerClick = (playerId: string) => {
    if (!isDrawingRoute || !canEdit) return;

    // Start a new route from this player
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      playerId: playerId,
      points: [],
      color: routeColor
    };

    // Find player position to start the route
    const player = current?.positions.find(p => p.id === playerId);
    if (player) {
      newRoute.points.push({ x: player.x, y: player.y });
    }

    setCurrentRoute(newRoute);
    setSelectedPlayerId(playerId);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (!isDrawingRoute || !currentRoute || !canEdit) return;

    // Snap route points to grid if snapping is enabled
    let clickX = x;
    let clickY = y;
    if (enableSnapping) {
      const snapped = snapToGrid(x, y);
      clickX = snapped.x;
      clickY = snapped.y;
    }

    // Add point to current route
    const updatedRoute = {
      ...currentRoute,
      points: [...currentRoute.points, { x: clickX, y: clickY }]
    };
    setCurrentRoute(updatedRoute);
  };

  const finishRoute = async () => {
    if (!currentRoute || !play || !canEdit || currentRoute.points.length < 2) {
      stopDrawingRoute();
      return;
    }

    // Add route to current slide
    const updatedSlides = play.slides.map(s => {
      if (s.index === slideIndex) {
        const existingRoutes = s.routes || [];
        // Remove any existing route for this player
        const filteredRoutes = existingRoutes.filter(r => r.playerId !== currentRoute.playerId);
        return {
          ...s,
          routes: [...filteredRoutes, currentRoute]
        };
      }
      return s;
    });

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    // Save to Firestore
    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error saving route:', error);
    } finally {
      setSaving(false);
      stopDrawingRoute();
    }
  };

  const deleteRoute = async (routeId: string) => {
    if (!play || !canEdit) return;

    const updatedSlides = play.slides.map(s => {
      if (s.index === slideIndex) {
        const existingRoutes = s.routes || [];
        return {
          ...s,
          routes: existingRoutes.filter(r => r.id !== routeId)
        };
      }
      return s;
    });

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error deleting route:', error);
    } finally {
      setSaving(false);
    }
  };

  const clearAllRoutes = async () => {
    if (!play || !canEdit) return;

    if (confirm('Clear all routes for this slide?')) {
      const updatedSlides = play.slides.map(s => {
        if (s.index === slideIndex) {
          return { ...s, routes: [] };
        }
        return s;
      });

      const newPlay = { ...play, slides: updatedSlides };
      setPlay(newPlay);

      try {
        setSaving(true);
        await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
      } catch (error) {
        console.error('Error clearing routes:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const addSlide = async () => {
    if (!play || !canEdit) return;

    // Get the last slide to copy positions from
    const lastSlide = play.slides[play.slides.length - 1];
    const newSlideIndex = lastSlide.index + 1;

    // Create new slide with copied positions
    const newSlide: Slide = {
      index: newSlideIndex,
      positions: lastSlide.positions.map(p => ({ ...p })), // Deep copy positions
      routes: [] // Start with no routes
    };

    const updatedSlides = [...play.slides, newSlide];
    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    // Navigate to the new slide
    setSlideIndex(newSlideIndex);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error adding slide:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSlide = async (index: number) => {
    if (!play || !canEdit || play.slides.length <= 1) return;

    if (!confirm(`Delete slide ${index}? This cannot be undone.`)) return;

    // Remove the slide
    const updatedSlides = play.slides
      .filter(s => s.index !== index)
      .map((s, i) => ({ ...s, index: i + 1 })); // Reindex remaining slides

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    // If we deleted the current slide, move to the first slide or the previous one
    if (slideIndex === index) {
      const newIndex = Math.min(slideIndex, updatedSlides.length);
      setSlideIndex(newIndex > 0 ? newIndex : 1);
    } else if (slideIndex > index) {
      // Adjust current index if it was after the deleted slide
      setSlideIndex(slideIndex - 1);
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error deleting slide:', error);
    } finally {
      setSaving(false);
    }
  };

  const current = useMemo(() => play?.slides.find(s => s.index === slideIndex) || null, [play, slideIndex]);

  // AI Assistant handlers
  const handleApplyFormation = async (positions: PlayerPosition[]) => {
    if (!play || !canEdit) return;

    const updatedSlides = play.slides.map(s =>
      s.index === slideIndex
        ? { ...s, positions }
        : s
    );

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error applying AI formation:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyRoutes = async (routeSuggestions: any[]) => {
    if (!play || !canEdit) return;

    // Convert AI route suggestions to our Route format
    const newRoutes: Route[] = routeSuggestions.map(suggestion => ({
      id: `route-${Date.now()}-${suggestion.playerId}`,
      playerId: suggestion.playerId,
      points: suggestion.points,
      color: routeColor
    }));

    const updatedSlides = play.slides.map(s => {
      if (s.index === slideIndex) {
        return { ...s, routes: newRoutes };
      }
      return s;
    });

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error applying AI routes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyVariation = async (variationSlide: Slide) => {
    if (!play || !canEdit) return;

    const updatedSlides = play.slides.map(s =>
      s.index === slideIndex
        ? { ...variationSlide, index: slideIndex }
        : s
    );

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error applying AI variation:', error);
    } finally {
      setSaving(false);
    }
  };

  // AI Play Generator handlers
  const handleGeneratorCanvasClick = (x: number, y: number) => {
    if (!isGeneratorMode) {
      handleCanvasClick(x, y); // Normal route drawing
      return;
    }

    // Snap to grid if enabled
    let clickX = x;
    let clickY = y;
    if (enableSnapping) {
      const snapped = snapToGrid(x, y);
      clickX = snapped.x;
      clickY = snapped.y;
    }

    if (generatorStep === 'place-ball') {
      setBallMarker({ x: clickX, y: clickY });
      setGeneratorStep('place-endpoint');
    } else if (generatorStep === 'place-endpoint') {
      setEndpointMarker({ x: clickX, y: clickY });
      setGeneratorStep('select-type');
      setShowGeneratorModal(true);
    }
  };

  const startAIPlayGenerator = () => {
    if (!canEdit) return;
    setIsGeneratorMode(true);
    setGeneratorStep('place-ball');
    setBallMarker(null);
    setEndpointMarker(null);
    // Disable route drawing mode if active
    if (isDrawingRoute) {
      stopDrawingRoute();
    }
  };

  const cancelAIPlayGenerator = () => {
    setIsGeneratorMode(false);
    setBallMarker(null);
    setEndpointMarker(null);
    setGeneratorStep('place-ball');
    setShowGeneratorModal(false);
  };

  const handleGeneratedPlay = async (generatedPlay: GeneratedPlay) => {
    if (!play || !canEdit) return;

    // Apply the generated positions and routes to the current slide
    const updatedSlides = play.slides.map(s => {
      if (s.index === slideIndex) {
        return {
          ...s,
          positions: generatedPlay.playerPositions,
          routes: generatedPlay.routes
        };
      }
      return s;
    });

    const newPlay = { ...play, slides: updatedSlides };
    setPlay(newPlay);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updatedSlides });
    } catch (error) {
      console.error('Error applying generated play:', error);
    } finally {
      setSaving(false);
      cancelAIPlayGenerator();
    }
  };

  // Red Team Challenge handlers
  const toggleRedTeam = () => {
    setIsRedTeamActive(!isRedTeamActive);
    if (isRedTeamActive) {
      // Turning off - clear defensive scheme
      setDefensiveScheme(null);
    }
  };

  const challengePlay = async () => {
    if (!current || isLoadingDefense) return;

    setIsLoadingDefense(true);
    try {
      const scheme = await challengePlayWithRedTeam({
        playerPositions: current.positions,
        routes: current.routes
      });
      setDefensiveScheme(scheme);
    } catch (error) {
      console.error('Error generating defensive scheme:', error);
      alert('Failed to generate defensive scheme. Please try again.');
    } finally {
      setIsLoadingDefense(false);
    }
  };

  const clearDefense = () => {
    setDefensiveScheme(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!play || !current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Play not found</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              {isEditingName && canEdit ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={playName}
                    onChange={(e) => setPlayName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  />
                  <button
                    onClick={() => handleNameSave()}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setPlayName(play.name);
                      setIsEditingName(false);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">{play.name}</h2>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Edit name"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Role: <span className="font-semibold capitalize">{role}</span>
                {canEdit ? ' (can edit)' : ' (Read Only)'}
                {saving && <span className="ml-2 text-blue-600">Saving...</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete Play
                </button>
              )}
              <Link
                to="/"
                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              >
                Back
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <button
                disabled={!canEdit}
                onClick={mirrorLeftRight}
                className={`px-3 py-2 rounded border transition-colors ${
                  canEdit
                    ? 'bg-white hover:bg-gray-50 border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                }`}
              >
                Mirror L/R
              </button>
              <button
                disabled={!canEdit}
                onClick={flipField}
                className={`px-3 py-2 rounded border transition-colors ${
                  canEdit
                    ? 'bg-white hover:bg-gray-50 border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                }`}
              >
                Flip Field
              </button>
              <button
                disabled={!canEdit}
                onClick={handleSnapToLOS}
                className={`px-3 py-2 rounded border transition-colors ${
                  canEdit
                    ? 'bg-white hover:bg-gray-50 border-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                }`}
              >
                Snap to LOS
              </button>
              <ExportButtons
                slide={current}
                fileBase={`${play.name.replace(/\s+/g, '_')}-slide${slideIndex}`}
                canvasRef={canvasRef}
              />

              {/* Grid Controls */}
              <div className="flex gap-3 items-center ml-auto border-l pl-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSnapping}
                    onChange={(e) => setEnableSnapping(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Snap to Grid</span>
                </label>
              </div>
            </div>

            {/* Route Drawing Controls & AI Features */}
            {canEdit && (
              <div className="flex gap-2 flex-wrap items-center border-t pt-3">
                {!isDrawingRoute && !isGeneratorMode ? (
                  <>
                    <button
                      onClick={startDrawingRoute}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Draw Route
                    </button>
                    <button
                      onClick={startAIPlayGenerator}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Play Generator
                    </button>
                    {current?.routes && current.routes.length > 0 && (
                      <button
                        onClick={clearAllRoutes}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Clear All Routes
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <label htmlFor="routeColor" className="text-sm text-gray-700">
                        Route Color:
                      </label>
                      <input
                        id="routeColor"
                        type="color"
                        value={routeColor}
                        onChange={(e) => setRouteColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </>
                ) : isGeneratorMode ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-purple-600">
                      {generatorStep === 'place-ball'
                        ? "Click on the field to place the ball starting position"
                        : generatorStep === 'place-endpoint'
                        ? "Click where you want the ball to end up"
                        : "Select play type in the modal"}
                    </span>
                    <button
                      onClick={cancelAIPlayGenerator}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-blue-600">
                      {!selectedPlayerId
                        ? "Click on a player to start drawing a route"
                        : "Click on the field to add route points"}
                    </span>
                    {currentRoute && currentRoute.points.length > 1 && (
                      <button
                        onClick={finishRoute}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Finish Route
                      </button>
                    )}
                    <button
                      onClick={stopDrawingRoute}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            <SlideControls
              current={slideIndex}
              setSlide={setSlideIndex}
              totalSlides={play.slides.length}
              onAddSlide={addSlide}
              onDeleteSlide={deleteSlide}
              canEdit={!!canEdit}
            />

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <CanvasField
                ref={canvasRef}
                players={current.positions}
                routes={current.routes || []}
                currentRoute={currentRoute}
                isDrawing={isDrawingRoute}
                onDrag={updatePosition}
                onRename={renamePosition}
                onCanvasClick={isGeneratorMode ? handleGeneratorCanvasClick : handleCanvasClick}
                onPlayerClick={handlePlayerClick}
                onRouteClick={deleteRoute}
                editable={!!canEdit}
                showGrid={showGrid}
                enableSnapping={enableSnapping}
                // AI Play Generator props
                ballMarker={ballMarker}
                endpointMarker={endpointMarker}
                onBallMarkerDrag={(x, y) => setBallMarker({ x, y })}
                onEndpointMarkerDrag={(x, y) => setEndpointMarker({ x, y })}
                // Red Team Challenge props
                defensivePlayers={defensiveScheme?.players || []}
                defensiveRoutes={defensiveScheme?.routes || []}
                showDefensiveAssignments={showDefensiveAssignments}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Play Preview</h3>
              <PlayPreview slides={play.slides} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      {canEdit && play && current && (
        <AIAssistant
          play={play}
          currentSlide={current}
          onApplyFormation={handleApplyFormation}
          onApplyRoutes={handleApplyRoutes}
          onApplyVariation={handleApplyVariation}
          onUpdatePlayName={handleNameSave}
        />
      )}

      {/* Red Team Panel */}
      {canEdit && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <RedTeamPanel
            isActive={isRedTeamActive}
            defensiveScheme={defensiveScheme}
            isLoading={isLoadingDefense}
            onToggle={toggleRedTeam}
            onChallenge={challengePlay}
            onClearDefense={clearDefense}
          />
        </div>
      )}

      {/* AI Play Generator Modal */}
      <PlayGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        onGenerate={handleGeneratedPlay}
        ballPosition={ballMarker}
        endpointPosition={endpointMarker}
      />
    </div>
  );
}