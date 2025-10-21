import React from 'react';

interface SlideControlsProps {
  current: number;
  setSlide: (slide: number) => void;
  totalSlides: number;
  onAddSlide?: () => void;
  onDeleteSlide?: (index: number) => void;
  canEdit?: boolean;
}

export default function SlideControls({
  current,
  setSlide,
  totalSlides,
  onAddSlide,
  onDeleteSlide,
  canEdit = false
}: SlideControlsProps) {
  const labels = ['Setup', 'Mid', 'Final', 'Extra 1', 'Extra 2', 'Extra 3', 'Extra 4', 'Extra 5', 'Extra 6', 'Extra 7'];
  const MAX_SLIDES = 10;

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <span className="text-sm font-medium text-gray-700">Slide:</span>
      <div className="flex gap-1">
        {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slide) => (
          <button
            key={slide}
            onClick={() => setSlide(slide)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${current === slide
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {slide}. {labels[slide - 1] || `Slide ${slide}`}
          </button>
        ))}
      </div>

      {canEdit && (
        <div className="flex gap-2 ml-4">
          {totalSlides < MAX_SLIDES && onAddSlide && (
            <button
              onClick={onAddSlide}
              className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              title="Add new slide"
            >
              + Add Slide
            </button>
          )}
          {totalSlides > 1 && onDeleteSlide && (
            <button
              onClick={() => onDeleteSlide(current)}
              className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="Delete current slide"
            >
              Delete Slide
            </button>
          )}
        </div>
      )}
    </div>
  );
}