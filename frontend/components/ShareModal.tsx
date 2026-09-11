'use client';

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  X,
  Share2,
  Copy,
  Check,
  FileDown,
  Mail,
  MessageCircle,
  ExternalLink,
  Link2,
  QrCode,
  Send,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  chatTitle?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    text?: string;
    content?: string;
    speechText?: string;
  }>;
}

export default function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  chatTitle,
  messages,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const fullShareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${shareUrl.startsWith('/') ? shareUrl : `/${shareUrl}`}`
      : shareUrl;

  const shareTitle = chatTitle || 'PradarshakAI Scheme Consultation';

  // Generate QR Code data URL whenever fullShareUrl changes
  useEffect(() => {
    if (fullShareUrl) {
      QRCode.toDataURL(fullShareUrl, {
        width: 280,
        margin: 1,
        color: {
          dark: '#0b1f3a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [fullShareUrl]);

  if (!isOpen) return null;

  // 1. Copy Link Handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for clipboard API restriction
      const input = document.createElement('input');
      input.value = fullShareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // 2. WhatsApp Handler
  const handleWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `PradarshakAI Scheme Advisory Consultation - ${shareTitle}\n${fullShareUrl}`
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. Email Handler
  const handleEmail = () => {
    const subject = encodeURIComponent(`PradarshakAI Scheme Consultation: ${shareTitle}`);
    const body = encodeURIComponent(
      `Hello,\n\nI wanted to share this scheme advisory consultation with you from PradarshakAI:\n\n${fullShareUrl}\n\nPradarshakAI helps citizens discover concessional credit schemes and state channelizing agency loans.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // 4. SMS / Messages Handler
  const handleSms = () => {
    const smsText = encodeURIComponent(`PradarshakAI Advisory: ${fullShareUrl}`);
    window.location.href = `sms:?body=${smsText}`;
  };

  // 5. Native Web Share (if supported)
  const hasNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!hasNativeShare) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: 'Consultation transcript from PradarshakAI',
        url: fullShareUrl,
      });
    } catch {
      // User cancelled share
    }
  };

  // 6. Download Chat as PDF
  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 45;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header Banner
      doc.setFillColor(11, 31, 58); // Government Navy #0b1f3a
      doc.rect(0, 0, pageWidth, 68, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('PradarshakAI', margin, 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(226, 232, 240);
      doc.text(
        'Ministry of Social Justice and Empowerment | Government of India',
        margin,
        48
      );

      doc.setTextColor(251, 191, 36); // Amber Accent
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('SCHEME ADVISORY CONSULTATION', pageWidth - margin, 32, {
        align: 'right',
      });

      y = 86;

      // Meta Info Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 42, 6, 6, 'FD');

      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(11, 31, 58);
      doc.text(shareTitle, margin + 14, y + 17);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Exported on ${dateStr} • Confidential Citizen Advisory`, margin + 14, y + 32);

      y += 56;

      // Turn-by-Turn Dialogue
      messages.forEach((msg) => {
        const isUser = msg.role === 'user';
        const roleLabel = isUser ? 'CITIZEN' : 'PRADARSHAK AI';
        const textContent = (msg.text || msg.content || '').replace(/\r\n/g, '\n').trim();

        if (!textContent) return;

        const lines = doc.splitTextToSize(textContent, contentWidth - 28);
        const estimatedHeight = 32 + lines.length * 13;

        if (y + estimatedHeight > pageHeight - 50) {
          doc.addPage();
          y = margin;
        }

        if (isUser) {
          doc.setFillColor(238, 242, 255);
          doc.setDrawColor(199, 210, 254);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
        }

        doc.roundedRect(margin, y, contentWidth, estimatedHeight, 6, 6, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        if (isUser) {
          doc.setTextColor(30, 64, 175);
        } else {
          doc.setTextColor(11, 31, 58);
        }
        doc.text(roleLabel, margin + 14, y + 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(lines, margin + 14, y + 26);

        y += estimatedHeight + 10;
      });

      // Page numbers footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `PradarshakAI Advisory • Page ${p} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: 'center' }
        );
      }

      const safeFilename = `PradarshakAI_Consultation_${Date.now().toString(36)}.pdf`;
      doc.save(safeFilename);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <>
      {/* ── Native OS Share Sheet Overlay Backdrop ── */}
      <div
        className="share-sheet-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'rgba(11, 31, 58, 0.35)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 180ms ease-out',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* ── Native OS Share Sheet / Panel Container ── */}
        <div
          className="share-sheet-panel"
          style={{
            width: '100%',
            maxWidth: '430px',
            background: '#ffffff',
            borderRadius: '22px',
            boxShadow: '0 20px 45px -12px rgba(11, 31, 58, 0.22), 0 0 0 1px rgba(11, 31, 58, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            margin: 'auto 24px auto auto', // Desktop default: Right-aligned floating panel
            animation: 'sharePanelDesktopIn 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
          }}
        >
          {/* Mobile Handle Indicator */}
          <div className="share-mobile-handle" style={{ display: 'none', width: '100%', justifyContent: 'center', paddingTop: 8 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#cbd5e1' }} />
          </div>

          {/* ── Top Header Bar ── */}
          <div
            style={{
              padding: '16px 20px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0b1f3a', fontWeight: 800, fontSize: 15 }}>
              <Share2 size={17} color="#0056b3" />
              <span>Share link</span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close share sheet"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                padding: 6,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Share Sheet Main Body ── */}
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column' }}>

            {/* ── Top Chat Share Preview Card (With embedded QR Code & Copy Link) ── */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {/* Left & Middle: Chat Thumbnail & URL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#0056b3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Link2 size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#0b1f3a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={shareTitle}
                  >
                    {shareTitle}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 1.5,
                    }}
                    title={fullShareUrl}
                  >
                    {fullShareUrl}
                  </div>
                </div>
              </div>

              {/* Right: [QR] and [Copy Link] Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {/* QR Code Action Button */}
                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  title="View QR code for this chat link"
                  aria-label="View QR code"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0b1f3a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0056b3';
                    e.currentTarget.style.background = '#f0f7ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <QrCode size={17} color="#0b1f3a" />
                </button>

                {/* Copy Link Button */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy chat share link"
                  aria-label="Copy link"
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 10,
                    background: copied ? '#f0fdf4' : '#0b1f3a',
                    border: copied ? '1px solid #86efac' : '1px solid #0b1f3a',
                    color: copied ? '#15803d' : '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    boxShadow: copied ? 'none' : '0 2px 6px rgba(11, 31, 58, 0.15)',
                  }}
                >
                  {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#ffffff" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* ── Sharing Destinations Grid ── */}
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#64748b',
                  marginBottom: 12,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Share using
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                }}
              >
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: '#25D366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 10px rgba(37, 211, 102, 0.22)',
                      transition: 'transform 150ms ease',
                    }}
                  >
                    <MessageCircle size={24} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>WhatsApp</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  onClick={handleEmail}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #0284c7, #0056b3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 10px rgba(2, 132, 199, 0.22)',
                      transition: 'transform 150ms ease',
                    }}
                  >
                    <Mail size={23} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Email</span>
                </button>

                {/* Messages / SMS */}
                <button
                  type="button"
                  onClick={handleSms}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 10px rgba(59, 130, 246, 0.22)',
                      transition: 'transform 150ms ease',
                    }}
                  >
                    <Send size={22} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Messages</span>
                </button>

                {/* More / System Native Share */}
                {hasNativeShare ? (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 150ms ease',
                      }}
                    >
                      <ExternalLink size={21} color="#475569" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>More</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 150ms ease',
                      }}
                    >
                      <Copy size={21} color="#475569" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Copy Link</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── QR Code Dialog Popover (When user clicks [QR]) ── */}
      {qrModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(11, 31, 58, 0.55)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 150ms ease-out',
          }}
          onClick={() => setQrModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#ffffff',
              borderRadius: 22,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(11, 31, 58, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              animation: 'scaleUp 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0b1f3a' }}>Scan to open chat</span>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                aria-label="Close QR view"
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Code Canvas/Image */}
            {qrDataUrl ? (
              <div style={{ padding: 12, background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <img src={qrDataUrl} alt="Chat Share QR Code" style={{ width: 210, height: 210, display: 'block' }} />
              </div>
            ) : (
              <div style={{ width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
                Generating QR code...
              </div>
            )}

            <p style={{ fontSize: 11.5, color: '#64748b', margin: '14px 0 16px', wordBreak: 'break-all', lineHeight: 1.4 }}>
              {fullShareUrl}
            </p>

            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 12,
                background: '#0b1f3a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13.5,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

