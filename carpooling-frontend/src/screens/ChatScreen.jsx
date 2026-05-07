import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpIcon from '../components/WpIcon';
import WpPill from '../components/WpPill';
import WpAvatar from '../components/WpAvatar';
import useIsDesktop from '../hooks/useIsDesktop';
import { getMessages, sendMessage, markRead, getPartners } from '../api/chat';

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

export default function ChatScreen({ rideId, onBack }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDesktop = useIsDesktop();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [driverName, setDriverName] = useState('Driver');
  const [partnerPhone, setPartnerPhone] = useState('');
  const listRef = useRef(null);

  const resolvedRideId = rideId;

  useEffect(() => {
    if (!resolvedRideId) return;
    getMessages(resolvedRideId)
      .then(res => {
        const msgs = res.data || [];
        setMessages(msgs);
        if (msgs.length && msgs[0].driverName) setDriverName(msgs[0].driverName);
        markRead(resolvedRideId).catch(() => {});
      })
      .catch(() => setMessages([]));

    getPartners(resolvedRideId)
      .then(res => {
        const partners = res.data?.data || res.data || [];
        if (partners.length > 0) {
          setDriverName(partners[0].name || 'Driver');
          setPartnerPhone(partners[0].phone || '');
        }
      })
      .catch(() => {});
  }, [resolvedRideId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const optimistic = { id: `opt-${Date.now()}`, message: text, senderId: currentUser?.id, timestamp: new Date().toISOString(), _sending: true };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await sendMessage({ rideId: resolvedRideId, message: text });
      setMessages(prev => prev.map(m => m.id === optimistic.id ? (res.data || { ...optimistic, _sending: false }) : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, _failed: true, _sending: false } : m));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isMe = (msg) => msg.senderId === currentUser?.id || msg.senderRole === 'PASSENGER';

  const MessageList = () => (
    <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {messages.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--asphalt-400)', fontSize: '13px', padding: '40px 0', fontFamily: 'var(--font-sans)' }}>
          No messages yet. Say hi!
        </div>
      )}
      {messages.map((msg, i) => {
        const mine = isMe(msg);
        return (
          <div key={msg.id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '72%',
              padding: '10px 14px',
              borderRadius: mine ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
              background: mine ? 'var(--ink-600)' : '#fff',
              color: mine ? '#fff' : 'var(--asphalt-900)',
              border: mine ? 'none' : '1px solid var(--asphalt-200)',
              boxShadow: 'var(--shadow-1)',
              opacity: msg._sending ? 0.7 : 1,
            }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                {msg.message || msg.content || msg.text}
                {msg._failed && <span style={{ color: 'var(--danger-300)', fontSize: '11px', marginLeft: '6px' }}>Failed</span>}
              </div>
              <div style={{ fontSize: '10px', marginTop: '4px', color: mine ? 'rgba(255,255,255,0.5)' : 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
                {formatTime(msg.timestamp || msg.sentAt)}{msg._sending && ' · Sending…'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const InputBar = ({ maxWidth }) => (
    <div style={{ background: '#fff', borderTop: '1px solid var(--asphalt-100)', padding: '12px 16px calc(env(safe-area-inset-bottom, 8px) + 12px)', display: 'flex', alignItems: 'center', gap: '10px', maxWidth, margin: '0 auto', width: '100%' }}>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message…"
        style={{ flex: 1, padding: '11px 16px', fontSize: '15px', fontFamily: 'var(--font-sans)', background: 'var(--asphalt-50)', border: '1.5px solid var(--asphalt-200)', borderRadius: 'var(--radius-pill)', outline: 'none', color: 'var(--asphalt-900)', boxSizing: 'border-box' }}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || sending}
        style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'var(--ink-600)' : 'var(--asphalt-200)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
      >
        <WpIcon name="send" size={18} color={input.trim() ? '#fff' : 'var(--asphalt-400)'} />
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 40px' }}>
        <div style={{ width: '100%', maxWidth: '760px', background: '#fff', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-3)', border: '1px solid var(--asphalt-100)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {onBack && (
              <button onClick={onBack || (() => navigate(-1))} style={{ width: 36, height: 36, borderRadius: 'var(--radius-pill)', background: 'var(--asphalt-100)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--asphalt-700)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <WpAvatar initials={getInitials(driverName)} size={40} tone="ink" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>{driverName}</div>
              <div style={{ fontSize: '12px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>In ride</div>
            </div>
            <WpPill tone="live">En route</WpPill>
            {partnerPhone && (
              <a href={`tel:${partnerPhone}`} style={{ color: 'var(--ink-600)', display: 'flex', alignItems: 'center', marginLeft: '8px' }} title={`Call ${driverName}`}>
                <WpIcon name="phone" size={22} color="var(--ink-600)" />
              </a>
            )}
          </div>

          <MessageList />
          <InputBar />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', flexDirection: 'column' }}>
      <WpAppBar
        title={driverName}
        sub="In ride"
        onBack={onBack || (() => navigate(-1))}
        trailing={
          partnerPhone ? (
            <a href={`tel:${partnerPhone}`} style={{ color: 'var(--ink-600)', display: 'flex', alignItems: 'center' }} title={`Call ${driverName}`}>
              <WpIcon name="phone" size={22} color="var(--ink-600)" />
            </a>
          ) : null
        }
      />
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', justifyContent: 'center' }}>
        <WpPill tone="live">En route</WpPill>
      </div>
      <MessageList />
      <InputBar />
    </div>
  );
}
