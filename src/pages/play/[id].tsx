import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import CanvasField, { CanvasHandle } from '../../components/CanvasField';
import SlideControls from '../../components/SlideControls';
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
import { FIELD, snapToGrid, snapToLOS, calculateRouteYardage, tripsRightTemplate, doublesTemplate, emptyTemplate } from '../../lib/formations';
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

  // Play notes state
  const [playNotes, setPlayNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Group selection state
  const [isGroupSelectMode, setIsGroupSelectMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

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
          setPlayNotes(playData.notes || '');
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

    // If in group select mode and this player is selected, move all selected players
    if (isGroupSelectMode && selectedPlayerIds.has(playerId)) {
      const currentSlide = play.slides.find(s => s.index === slideIndex);
      if (!currentSlide) return;

      // Find the player being dragged
      const draggedPlayer = currentSlide.positions.find(p => p.id === playerId);
      if (!draggedPlayer) return;

      // Calculate the delta
      const deltaX = x - draggedPlayer.x;
      const deltaY = y - draggedPlayer.y;

      // Update all selected players by the same delta
      const updatedSlides = play.slides.map(s =>
        s.index === slideIndex
          ? {
              ...s,
              positions: s.positions.map(p =>
                selectedPlayerIds.has(p.id)
                  ? { ...p, x: p.x + deltaX, y: p.y + deltaY }
                  : p
              )
            }
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
    } else {
      // Normal single player movement
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

    // Apply snapToLOS to current slide only
    const updated = play.slides.map(s => {
      if (s.index === slideIndex) {
        return {
          ...s,
          positions: snapToLOS(s.positions)
        };
      }
      return s;
    });

    const np = { ...play, slides: updated };
    setPlay(np);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updated });
      alert('Players aligned to Line of Scrimmage!');
    } catch (error) {
      console.error('Error snapping to LOS:', error);
      alert('Failed to snap to LOS');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!play || !canEdit) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { notes: playNotes });
      setPlay({ ...play, notes: playNotes });
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToFormation = async () => {
    if (!play || !canEdit || !play.formation) {
      alert('Formation template not available for this play');
      return;
    }

    if (!confirm('Reset all player positions to original formation? Routes will be preserved.')) {
      return;
    }

    // Get the original formation template
    const templateSlides = play.formation === 'trips'
      ? tripsRightTemplate()
      : play.formation === 'doubles'
      ? doublesTemplate()
      : emptyTemplate();

    const basePositions = templateSlides[0].positions;

    // Reset positions but keep routes for each slide
    const updated = play.slides.map(s => ({
      ...s,
      positions: basePositions.map(p => ({ ...p })) // Deep copy
    }));

    const np = { ...play, slides: updated };
    setPlay(np);

    try {
      setSaving(true);
      await updateDoc(doc(db, 'plays', play.id), { slides: updated });
    } catch (error) {
      console.error('Error resetting to formation:', error);
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
    // Group select mode: toggle player selection
    if (isGroupSelectMode && canEdit) {
      setSelectedPlayerIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) {
          newSet.delete(playerId);
        } else {
          newSet.add(playerId);
        }
        return newSet;
      });
      return;
    }

    // Route drawing mode
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

  const toggleGroupSelectMode = () => {
    setIsGroupSelectMode(!isGroupSelectMode);
    // Clear selections when toggling off
    if (isGroupSelectMode) {
      setSelectedPlayerIds(new Set());
    }
    // Exit route drawing mode when entering group select mode
    if (!isGroupSelectMode && isDrawingRoute) {
      stopDrawingRoute();
    }
  };

  const selectAllPlayers = () => {
    if (!current) return;
    setSelectedPlayerIds(new Set(current.positions.map(p => p.id)));
  };

  const clearSelection = () => {
    setSelectedPlayerIds(new Set());
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

    // Calculate yardage for the route
    const yardage = calculateRouteYardage(currentRoute);
    const routeWithYardage = { ...currentRoute, yardage };

    // Add route to current slide
    const updatedSlides = play.slides.map(s => {
      if (s.index === slideIndex) {
        const existingRoutes = s.routes || [];
        // Remove any existing route for this player
        const filteredRoutes = existingRoutes.filter(r => r.playerId !== currentRoute.playerId);
        return {
          ...s,
          routes: [...filteredRoutes, routeWithYardage]
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
    <div className="min-h-screen bg-gray-50 py-3 md:py-6">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex-1 w-full sm:w-auto">
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
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{play.name}</h2>
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
            <div className="flex gap-2 w-full sm:w-auto">
              {canEdit && (
                <button
                  onClick={handleDelete}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  Delete Play
                </button>
              )}
              <Link
                to="/"
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors text-center text-sm sm:text-base"
              >
                Back
              </Link>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex gap-2 flex-wrap items-center text-sm sm:text-base">
              <button
                disabled={!canEdit}
                onClick={toggleGroupSelectMode}
                className={`px-3 py-2 rounded border transition-colors font-bold ${
                  isGroupSelectMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700 border-purple-700'
                    : canEdit
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-400'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                }`}
              >
                {isGroupSelectMode ? '✓ Group Select' : 'Group Select'}
              </button>
              {isGroupSelectMode && selectedPlayerIds.size > 0 && (
                <>
                  <span className="text-sm font-semibold text-purple-700">
                    {selectedPlayerIds.size} selected
                  </span>
                  <button
                    onClick={selectAllPlayers}
                    className="px-3 py-2 rounded border bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-300 transition-colors font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 rounded border bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-400 transition-colors font-medium"
                  >
                    Clear
                  </button>
                </>
              )}
              <button
                disabled={!canEdit}
                onClick={mirrorLeftRight}
                className={`px-3 py-2 rounded border transition-colors font-medium ${
                  canEdit
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-400'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                }`}
              >
                Mirror L/R
              </button>
              <button
                disabled={!canEdit}
                onClick={flipField}
                className={`px-3 py-2 rounded border transition-colors font-medium ${
                  canEdit
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-400'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                }`}
              >
                Flip Field
              </button>
              <button
                disabled={!canEdit}
                onClick={handleSnapToLOS}
                className={`px-3 py-2 rounded border transition-colors font-medium ${
                  canEdit
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-400'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                }`}
              >
                Snap to LOS
              </button>
              {play.formation && (
                <button
                  disabled={!canEdit}
                  onClick={handleResetToFormation}
                  className={`px-3 py-2 rounded border transition-colors ${
                    canEdit
                      ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  }`}
                  title="Reset all players to original formation positions"
                >
                  Reset to Formation
                </button>
              )}
              <ExportButtons
                slide={current}
                fileBase={`${play.name.replace(/\s+/g, '_')}-slide${slideIndex}`}
                canvasRef={canvasRef}
              />

              {/* Grid Controls */}
              <div className="flex gap-2 sm:gap-3 items-center sm:ml-auto sm:border-l sm:pl-3 w-full sm:w-auto justify-center sm:justify-start">
                <label className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Show Grid</span>
                </label>
                <label className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSnapping}
                    onChange={(e) => setEnableSnapping(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Snap to Grid</span>
                </label>
              </div>
            </div>

            {/* Route Drawing Controls & AI Features */}
            {canEdit && (
              <div className="border-t pt-3">
                {!isDrawingRoute && !isGeneratorMode ? (
                  <div className="space-y-3">
                    {/* Main Actions */}
                    <div className="flex gap-3 flex-wrap items-center">
                      <button
                        onClick={startDrawingRoute}
                        className="btn-primary flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Draw Route
                      </button>
                      <button
                        onClick={startAIPlayGenerator}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 font-bold shadow-lg border-2 border-purple-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Play Generator
                      </button>
                      {current?.routes && current.routes.length > 0 && (
                        <button
                          onClick={clearAllRoutes}
                          className="btn-danger flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear All Routes
                        </button>
                      )}
                    </div>

                    {/* Route Settings */}
                    <div className="flex gap-4 items-center bg-iron-800/30 rounded-lg p-3 border border-iron-700">
                      <div className="flex items-center gap-2">
                        <label htmlFor="routeColor" className="text-sm font-semibold text-white">
                          Route Color:
                        </label>
                        <input
                          id="routeColor"
                          type="color"
                          value={routeColor}
                          onChange={(e) => setRouteColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-iron-600"
                        />
                      </div>
                      {current?.routes && current.routes.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="font-semibold text-white">{current.routes.length} route{current.routes.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : isGeneratorMode ? (
                  <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4">
                    <div className="flex gap-3 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-purple-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-semibold text-purple-800">
                          {generatorStep === 'place-ball'
                            ? "Step 1: Click on the field to place the ball starting position"
                            : generatorStep === 'place-endpoint'
                            ? "Step 2: Click where you want the ball to end up"
                            : "Step 3: Select play type in the modal"}
                        </span>
                      </div>
                      <button
                        onClick={cancelAIPlayGenerator}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Step Indicator */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${!selectedPlayerId ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                            {!selectedPlayerId ? '1' : '✓'}
                          </div>
                          <span className={`text-sm font-semibold ${!selectedPlayerId ? 'text-blue-800' : 'text-gray-600'}`}>
                            Select Player
                          </span>
                        </div>
                        <div className="h-0.5 w-8 bg-blue-300"></div>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectedPlayerId && (!currentRoute || currentRoute.points.length < 2) ? 'bg-blue-600 text-white' : selectedPlayerId ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
                            {selectedPlayerId && currentRoute && currentRoute.points.length >= 2 ? '✓' : '2'}
                          </div>
                          <span className={`text-sm font-semibold ${selectedPlayerId && (!currentRoute || currentRoute.points.length < 2) ? 'text-blue-800' : 'text-gray-600'}`}>
                            Draw Path
                          </span>
                        </div>
                        <div className="h-0.5 w-8 bg-blue-300"></div>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentRoute && currentRoute.points.length >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
                            3
                          </div>
                          <span className={`text-sm font-semibold ${currentRoute && currentRoute.points.length >= 2 ? 'text-blue-800' : 'text-gray-600'}`}>
                            Finish
                          </span>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">
                          {!selectedPlayerId
                            ? "Click on a player on the field to start drawing their route"
                            : "Click on the field to add waypoints to the route"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 items-center">
                        {currentRoute && currentRoute.points.length > 1 && (
                          <button
                            onClick={finishRoute}
                            className="btn-success flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Finish Route
                            {currentRoute && <span className="text-xs opacity-80">({Math.round(calculateRouteYardage(currentRoute) * 10) / 10}y)</span>}
                          </button>
                        )}
                        <button
                          onClick={stopDrawingRoute}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Canvas and Notes Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Canvas Field - Takes 2/3 of space */}
              <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                  // Group selection props
                  selectedPlayerIds={selectedPlayerIds}
                  isGroupSelectMode={isGroupSelectMode}
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

              {/* Play Notes Section - Takes 1/3 of space */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Play Notes</h3>
                  {canEdit && !isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {isEditingNotes && canEdit ? (
                  <div className="space-y-3">
                    <textarea
                      value={playNotes}
                      onChange={(e) => setPlayNotes(e.target.value)}
                      placeholder="Add notes about this play: objectives, key reads, coaching points, etc."
                      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNotes}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => {
                          setPlayNotes(play.notes || '');
                          setIsEditingNotes(false);
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {playNotes ? (
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{playNotes}</p>
                    ) : (
                      <p className="text-gray-600 font-medium">No notes added yet. Click Edit to add play notes.</p>
                    )}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Quick Stats</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Total Slides:</span>
                      <span className="font-bold text-gray-900">{play.slides.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Routes (this slide):</span>
                      <span className="font-bold text-gray-900">{current.routes?.length || 0}</span>
                    </div>
                    {play.formation && (
                      <div className="flex justify-between">
                        <span className="text-gray-700 font-medium">Formation:</span>
                        <span className="font-bold text-gray-900 capitalize">
                          {play.formation === 'trips' ? 'Trips Right' : play.formation === 'doubles' ? 'Doubles' : 'Empty'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Slide Controls with Thumbnails and Animation - Below Canvas */}
            <SlideControls
              current={slideIndex}
              setSlide={setSlideIndex}
              totalSlides={play.slides.length}
              slides={play.slides}
              onAddSlide={addSlide}
              onDeleteSlide={deleteSlide}
              canEdit={!!canEdit}
            />
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