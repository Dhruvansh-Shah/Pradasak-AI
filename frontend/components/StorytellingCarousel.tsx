'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface StoryItem {
  id: string;
  category: string;
  headline: string;
  description: string;
  imageSrc: string;
  altText: string;
}

const STORY_IMAGES = [
  {
    id: 'family-enterprise',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20wide-angle%20photograph%20of%20a%20diverse%20Indian%20family%20%E2%80%94%20a%20young%20couple%20wi%20310217%20(1).png',
    defaultCategory: 'FAMILY ENTERPRISE',
    defaultHeadline: 'Fostering Self-Reliance Through Family-Owned Businesses.',
    defaultDescription:
      'Through concessional credit schemes, the Ministry enables families from marginalized communities to establish viable local retail ventures, securing stable livelihoods and fostering generational financial independence within their local economies.',
    defaultAlt:
      'Indian family standing with official loan approval document outside their local retail enterprise',
  },
  {
    id: 'women-entrepreneurship',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20portrait%20of%20a%20young%20Indian%20Dalit%20woman%20entrepreneur%20in%20her%20mid-20s%2C%20%20310217.png',
    defaultCategory: 'WOMEN ENTREPRENEURSHIP',
    defaultHeadline: 'Empowering Women Entrepreneurs With Affordable Capital.',
    defaultDescription:
      'The Ministry provides targeted low-interest loan assistance to women entrepreneurs in tailoring and manufacturing, giving them the working capital needed to purchase modern machinery and scale independent self-employment enterprises.',
    defaultAlt:
      'Young Indian woman entrepreneur in her tailoring and textile enterprise',
  },
  {
    id: 'citizen-access',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20an%20Indian%20citizen%20%E2%80%94%20a%20middle-aged%20man%20in%20a%20checked%20shi%20310217.png',
    defaultCategory: 'DIGITAL CITIZEN ACCESS',
    defaultHeadline: 'Simplifying Scheme Discovery at the Grassroots Level.',
    defaultDescription:
      'PradarshakAI and Common Service Centres bridge the information gap for citizens, offering transparent eligibility verification and personalized scheme recommendations so beneficiaries can confidently access government financial assistance without intermediaries.',
    defaultAlt:
      'Indian citizen receiving assisted digital scheme access at a service centre',
  },
  {
    id: 'education-skills',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20a%20group%20of%20young%20Indian%20students%20from%20diverse%20backgrou%20310217.png',
    defaultCategory: 'EDUCATION & SKILL DEVELOPMENT',
    defaultHeadline: 'Funding Technical Aspirations and Career Growth.',
    defaultDescription:
      'Through subsidized education loan programs, the Ministry ensures meritorious students from backward classes and scheduled castes can pursue higher technical and professional qualifications without the burden of commercial interest rates.',
    defaultAlt:
      'Students pursuing vocational technical skills and practical higher education',
  },
  {
    id: 'self-help-groups',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20a%20group%20of%20five%20Indian%20women%20from%20a%20rural%20self-help%20gr%20310217.png',
    defaultCategory: 'SELF-HELP GROUPS',
    defaultHeadline: 'Building Collective Livelihoods Through Accessible Finance.',
    defaultDescription:
      'Through concessional microfinance support, the Ministry helps women self-help groups access affordable financial assistance, strengthen collective livelihoods, and build sustainable income-generating opportunities for rural communities.',
    defaultAlt:
      'Rural women self-help group members planning community enterprise initiatives',
  },
  {
    id: 'institutional-partnerships',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20a%20young%20Indian%20tribal%20man%20in%20semi-formal%20clothes%20recei%20310217.png',
    defaultCategory: 'INSTITUTIONAL PARTNERSHIPS',
    defaultHeadline: 'Connecting Beneficiaries Directly With Channel Partners.',
    defaultDescription:
      'The portal links applicants directly to nominated state channelising agencies and public sector banks, guaranteeing transparent processing, scheduled disbursement, and clear repayment terms under national welfare finance corporations.',
    defaultAlt:
      'Citizen receiving official loan passbook from channel partner bank officer',
  },
  {
    id: 'artisan-crafts',
    imageSrc:
      '/images/leadership/homepage/Firefly_A%20photorealistic%20photograph%20of%20an%20Indian%20potter%20%E2%80%94%20an%20elderly%20man%20with%20weathered%20hands%20310217.png',
    defaultCategory: 'ARTISAN LIVELIHOODS',
    defaultHeadline: 'Preserving Heritage Crafts With Concessional Credit.',
    defaultDescription:
      'Dedicated artisan loan initiatives provide traditional craftspeople with low-cost credit to modernize workshops, procure raw materials in bulk, and protect valuable cultural trades against market vulnerabilities.',
    defaultAlt:
      'Master artisan creating pottery on a traditional wheel in an artisan workshop',
  },
];

const TOTAL_SLIDES = STORY_IMAGES.length;

export default function StorytellingCarousel() {
  const { t } = useLanguage();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const STORY_KEY_MAP: Record<string, string> = {
    'family-enterprise': 'family',
    'women-entrepreneurship': 'women',
    'citizen-access': 'citizen',
    'education-skills': 'edu',
    'self-help-groups': 'shg',
    'institutional-partnerships': 'partner',
    'artisan-crafts': 'artisan',
  };

  const stories: StoryItem[] = useMemo(() => {
    return STORY_IMAGES.map((item) => {
      const shortKey = STORY_KEY_MAP[item.id] || item.id;
      return {
        id: item.id,
        category: t(`home.story.${shortKey}.cat`, t(`home.story.${item.id}.cat`, item.defaultCategory)),
        headline: t(`home.story.${shortKey}.title`, t(`home.story.${item.id}.title`, item.defaultHeadline)),
        description: t(`home.story.${shortKey}.desc`, t(`home.story.${item.id}.desc`, item.defaultDescription)),
        imageSrc: item.imageSrc,
        altText: t(`home.story.${shortKey}.alt`, t(`home.story.${item.id}.alt`, item.defaultAlt)),
      };
    });
  }, [t]);

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

  // Automatic slide timing: 3.8 seconds per slide
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!isHovered && !prefersReducedMotion) {
      timerRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % TOTAL_SLIDES);
      }, 3800);
    }
  }, [isHovered, prefersReducedMotion]);

  const goToSlide = useCallback((index: number) => {
    const nextIdx = ((index % TOTAL_SLIDES) + TOTAL_SLIDES) % TOTAL_SLIDES;
    setActiveSlide(nextIdx);
    resetTimer();
  }, [resetTimer]);

  const handleNext = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % TOTAL_SLIDES);
    resetTimer();
  }, [resetTimer]);

  const handlePrev = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetTimer]);

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
      {/* ── PREVIOUS SLIDE BUTTON ────────────────────────────────────────── */}
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

      {/* ── NEXT SLIDE BUTTON ────────────────────────────────────────────── */}
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

      {/* ── SYNCHRONIZED SLIDES STACK ────────────────────────────────────────
          Each slide contains BOTH its text (left) and image (right).
          When activeSlide changes, image N and description N crossfade together
          with the exact same timing. No independent animations or drift.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="hero-story-slides-stack"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          width: '100%',
          position: 'relative',
        }}
      >
        {stories.map((story, index) => {
          const isActive = index === activeSlide;

          return (
            <div
              key={story.id}
              className="hero-editorial-split"
              aria-hidden={!isActive}
              style={{
                gridArea: '1 / 1 / 2 / 2',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 'clamp(260px, calc(100vh - 210px), 450px)',
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
                transform: prefersReducedMotion
                  ? 'none'
                  : isActive
                  ? 'scale(1) translateY(0)'
                  : 'scale(0.99) translateY(4px)',
                transition: prefersReducedMotion
                  ? 'none'
                  : 'opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), transform 650ms cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: isActive ? 2 : 1,
              }}
            >
              {/* ── LEFT COLUMN: STORYTELLING CONTENT ─────────────────────── */}
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
                    {story.category}
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
                  }}
                >
                  {story.headline}
                </h2>

                {/* Supporting Description */}
                <p
                  className="story-desc-text"
                  style={{
                    fontSize: 'clamp(14px, 1.4vw, 16px)',
                    fontWeight: 400,
                    color: '#334155',
                    lineHeight: 1.55,
                    margin: '0 0 20px 0',
                  }}
                >
                  {story.description}
                </p>

                {/* Indicator & Slide Counter */}
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
                    {stories.map((_, dotIdx) => {
                      const isDotActive = dotIdx === activeSlide;
                      return (
                        <button
                          key={dotIdx}
                          type="button"
                          role="tab"
                          aria-selected={isDotActive}
                          aria-label={`Slide ${dotIdx + 1} of ${TOTAL_SLIDES}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            goToSlide(dotIdx);
                          }}
                          style={{
                            width: isDotActive ? '22px' : '7px',
                            height: '7px',
                            borderRadius: '4px',
                            backgroundColor: isDotActive ? '#003366' : '#cbd5e1',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'all 240ms ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isDotActive) e.currentTarget.style.backgroundColor = '#94a3b8';
                          }}
                          onMouseLeave={(e) => {
                            if (!isDotActive) e.currentTarget.style.backgroundColor = '#cbd5e1';
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
                    0{activeSlide + 1} / 0{TOTAL_SLIDES}
                  </span>
                </div>
              </div>

              {/* ── RIGHT COLUMN: COMPLETE IMAGE (RIGHT-ALIGNED TO EDGE) ──── */}
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
            </div>
          );
        })}
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
