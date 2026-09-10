'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryItem {
  id: string;
  category: string;
  headline: string;
  description: string;
  imageSrc: string;
  altText: string;
}

const STORIES: StoryItem[] = [
  {
    id: 'family-enterprise',
    category: 'FAMILY ENTERPRISE',
    headline: 'Fostering Self-Reliance Through Family-Owned Businesses.',
    description:
      'Through concessional credit schemes, the Ministry enables families from marginalized communities to establish viable local retail ventures, securing stable livelihoods and fostering generational financial independence within their local economies.',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20wide-angle%20photograph%20of%20a%20diverse%20Indian%20family%20%E2%80%94%20a%20young%20couple%20wi%20310217%20(1).png',
    altText:
      'Indian family standing with official loan approval document outside their local retail enterprise',
  },
  {
    id: 'women-entrepreneurship',
    category: 'WOMEN ENTREPRENEURSHIP',
    headline: 'Empowering Women Entrepreneurs With Affordable Capital.',
    description:
      'The Ministry provides targeted low-interest loan assistance to women entrepreneurs in tailoring and manufacturing, giving them the working capital needed to purchase modern machinery and scale independent self-employment enterprises.',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20portrait%20of%20a%20young%20Indian%20Dalit%20woman%20entrepreneur%20in%20her%20mid-20s%2C%20%20310217.png',
    altText:
      'Young Indian woman entrepreneur in her tailoring and textile enterprise',
  },
  {
    id: 'citizen-access',
    category: 'DIGITAL CITIZEN ACCESS',
    headline: 'Simplifying Scheme Discovery at the Grassroots Level.',
    description:
      'PradarshakAI and Common Service Centres bridge the information gap for citizens, offering transparent eligibility verification and personalized scheme recommendations so beneficiaries can confidently access government financial assistance without intermediaries.',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20an%20Indian%20citizen%20%E2%80%94%20a%20middle-aged%20man%20in%20a%20checked%20shi%20310217.png',
    altText:
      'Indian citizen receiving assisted digital scheme access at a service centre',
  },
  {
    id: 'education-skills',
    category: 'EDUCATION & SKILL DEVELOPMENT',
    headline: 'Funding Technical Aspirations and Career Growth.',
    description:
      'Through subsidized education loan programs, the Ministry ensures meritorious students from backward classes and scheduled castes can pursue higher technical and professional qualifications without the burden of commercial interest rates.',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20a%20group%20of%20young%20Indian%20students%20from%20diverse%20backgrou%20310217.png',
    altText:
      'Students pursuing vocational technical skills and practical higher education',
  },
  {
    id: 'self-help-groups',
    category: 'SELF-HELP GROUPS',
    headline: 'Building Collective Livelihoods Through Accessible Finance.',
    description:
      'Through concessional microfinance support, the Ministry helps women self-help groups access affordable financial assistance, strengthen collective livelihoods, and build sustainable income-generating opportunities for rural communities.',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20a%20group%20of%20five%20Indian%20women%20from%20a%20rural%20self-help%20gr%20310217.png',
    altText:
      'Rural women self-help group members planning community enterprise initiatives',
  },
  {
    id: 'institutional-partnerships',
    category: 'INSTITUTIONAL PARTNERSHIPS',
    headline: 'Connecting Beneficiaries Directly With Channel Partners.',
    description:
      'The portal links applicants directly to nominated state channelising agencies and public sector banks, guaranteeing transparent processing, scheduled disbursement, and clear repayment terms under national welfare finance corporations.',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20a%20young%20Indian%20tribal%20man%20in%20semi-formal%20clothes%20recei%20310217.png',
    altText:
      'Citizen receiving official loan passbook from channel partner bank officer',
  },
  {
    id: 'artisan-crafts',
    category: 'ARTISAN LIVELIHOODS',
    headline: 'Preserving Heritage Crafts With Concessional Credit.',
    description:
      'Dedicated artisan loan initiatives provide traditional craftspeople with low-cost credit to modernize workshops, procure raw materials in bulk, and protect valuable cultural trades against market vulnerabilities.',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20an%20Indian%20potter%20%E2%80%94%20an%20elderly%20man%20with%20weathered%20hands%20310217.png',
    altText:
      'Master artisan creating pottery on a traditional wheel in an artisan workshop',
  },
];

export default function StorytellingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [fadeText, setFadeText] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const changeSlide = useCallback((nextIdx: number) => {
    setFadeText(false);
    setTimeout(() => {
      setCurrentIndex(nextIdx);
      setFadeText(true);
    }, 240);
  }, []);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % STORIES.length;
    changeSlide(nextIdx);
  }, [currentIndex, changeSlide]);

  const handlePrev = useCallback(() => {
    const prevIdx = (currentIndex - 1 + STORIES.length) % STORIES.length;
    changeSlide(prevIdx);
  }, [currentIndex, changeSlide]);

  // Automatic slide timing: 3.8 seconds
  useEffect(() => {
    if (prefersReducedMotion || isHovered) return;

    const interval = setInterval(() => {
      handleNext();
    }, 3800);

    return () => clearInterval(interval);
  }, [handleNext, isHovered, prefersReducedMotion]);

  // Mobile Touch Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const swipeThreshold = 40;

    if (diff > swipeThreshold) {
      handleNext();
    } else if (diff < -swipeThreshold) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  const currentStory = STORIES[currentIndex];

  return (
    <div
      className="hero-storytelling-carousel-root"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Ministry Impact and Citizen Beneficiary Stories"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        outline: 'none',
      }}
    >
      {/* ── LEFTMOST NAVIGATION BUTTON (PREVIOUS SLIDE) ────────────────── */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        aria-label="Previous story"
        className="nav-btn-leftmost"
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid #cbd5e1',
          color: '#003366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0, 30, 64, 0.12)',
          zIndex: 25,
          transition: 'all 200ms ease',
        }}
      >
        <ChevronLeft size={22} />
      </button>

      {/* ── RIGHTMOST NAVIGATION BUTTON (NEXT SLIDE) ───────────────────── */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        aria-label="Next story"
        className="nav-btn-rightmost"
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid #cbd5e1',
          color: '#003366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0, 30, 64, 0.12)',
          zIndex: 25,
          transition: 'all 200ms ease',
        }}
      >
        <ChevronRight size={22} />
      </button>

      {/* ── TWO-PART EDITORIAL COMPOSITION (TEXT LEFT • IMAGE RIGHT) ────── */}
      <div
        className="hero-editorial-split"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 'clamp(260px, calc(100vh - 210px), 450px)',
        }}
      >
        {/* ── LEFT COLUMN: STORYTELLING CONTENT ───────────────────────────── */}
        <div
          className="hero-story-left-content"
          style={{
            flex: '1 1 44%',
            maxWidth: '560px',
            paddingLeft: 'clamp(24px, 4.5vw, 64px)',
            paddingRight: '32px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Subtle Category Pill with Saffron Accent */}
          <div
            className="story-category-wrapper"
            style={{
              opacity: fadeText ? 1 : 0,
              transform: fadeText ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 280ms ease-out, transform 280ms ease-out',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#F58220', // National Saffron accent
                display: 'inline-block',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#b45309', // Deep amber/saffron
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {currentStory.category}
            </span>
          </div>

          {/* Main Impact Statement (Bold Deep Navy) */}
          <h2
            className="story-headline-text"
            style={{
              fontSize: 'clamp(22px, 2.4vw, 32px)',
              fontWeight: 800,
              color: '#003366',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              margin: '0 0 12px 0',
              opacity: fadeText ? 1 : 0,
              transform: fadeText ? 'translateY(0)' : 'translateY(6px)',
              transition:
                'opacity 340ms ease-out 60ms, transform 340ms ease-out 60ms',
            }}
          >
            {currentStory.headline}
          </h2>

          {/* Supporting Description (25–40 words explaining Ministry impact) */}
          <p
            className="story-desc-text"
            style={{
              fontSize: 'clamp(14px, 1.4vw, 16px)',
              fontWeight: 400,
              color: '#334155',
              lineHeight: 1.55,
              margin: '0 0 20px 0',
              opacity: fadeText ? 1 : 0,
              transform: fadeText ? 'translateY(0)' : 'translateY(6px)',
              transition:
                'opacity 400ms ease-out 120ms, transform 400ms ease-out 120ms',
            }}
          >
            {currentStory.description}
          </p>

          {/* Indicator & Slide Counter near storytelling section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Minimal Dot Indicators */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              role="tablist"
              aria-label="Story carousel slides"
            >
              {STORIES.map((_, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1} of ${STORIES.length}`}
                    onClick={() => changeSlide(idx)}
                    style={{
                      width: isActive ? '22px' : '7px',
                      height: '7px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? '#003366' : '#cbd5e1',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 240ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.backgroundColor = '#94a3b8';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        e.currentTarget.style.backgroundColor = '#cbd5e1';
                    }}
                  />
                );
              })}
            </div>

            {/* Subtle Counter: 01 / 07 */}
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                letterSpacing: '0.04em',
              }}
              aria-hidden="true"
            >
              0{currentIndex + 1} / 0{STORIES.length}
            </span>
          </div>
        </div>

        {/* ── RIGHT COLUMN: COMPLETE IMAGE (RIGHT-ALIGNED TO EDGE) ────────── */}
        <div
          className="hero-story-right-image-container"
          style={{
            flex: '0 0 auto',
            width: 'clamp(320px, 54vw, 760px)',
            height: 'clamp(260px, calc(100vh - 210px), 440px)',
            position: 'relative',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {STORIES.map((story, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={story.id}
                aria-hidden={!isActive}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end', // Flush right!
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: isActive ? 2 : 1,
                }}
              >
                {/* Complete Image with object-fit: contain (Zero Cropping, Same Dimensions) */}
                <img
                  src={story.imageSrc}
                  alt={story.altText}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px 0 0 8px',
                    border: '1px solid #e2e8f0',
                    borderRight: 'none',
                    boxShadow: '-6px 6px 24px rgba(0, 30, 64, 0.08)',
                    display: 'block',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        :global(.nav-btn-leftmost:hover),
        :global(.nav-btn-rightmost:hover) {
          background-color: #003366 !important;
          color: #ffffff !important;
          border-color: #003366 !important;
          transform: translateY(-50%) scale(1.08) !important;
        }

        @media (max-width: 960px) {
          .hero-editorial-split {
            flex-direction: column !important;
            min-height: auto !important;
          }
          .hero-story-left-content {
            max-width: 100% !important;
            padding: 0 20px 20px !important;
            text-align: center !important;
            align-items: center !important;
          }
          .hero-story-right-image-container {
            width: 100% !important;
            height: clamp(230px, 48vw, 360px) !important;
            justify-content: center !important;
            padding: 0 16px !important;
          }
          .hero-story-right-image-container img {
            border-radius: 8px !important;
            border-right: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
}
