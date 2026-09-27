'use client';

import { useChat } from '@ai-sdk/react';
import { useState, type FormEvent, type ReactNode } from 'react';

function RecommendationIcon({
  kind,
}: {
  kind: 'book' | 'travel' | 'music';
}) {
  if (kind === 'book') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M12 6.5c-2.5-1.6-5.2-1.8-8-1v13c2.8-.8 5.5-.6 8 1 2.5-1.6 5.2-1.8 8-1v-13c-2.8-.8-5.5-.6-8 1Z" />
        <path d="M12 6.5v13" />
      </svg>
    );
  }

  if (kind === 'travel') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="m21 3-9 18-2.5-7.5L2 11l19-8Z" />
        <path d="M21 3 9.5 13.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
      <rect x="2.5" y="13" width="4" height="7" rx="2" />
      <rect x="17.5" y="13" width="4" height="7" rx="2" />
    </svg>
  );
}

function formatMessage(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((piece, index) =>
    piece.startsWith('**') && piece.endsWith('**') ? (
      <strong key={index} className="font-semibold">
        {piece.slice(2, -2)}
      </strong>
    ) : (
      piece
    )
  );
}

function extractRecommendation(text: string, labels: string[]): string {
  const line = text
    .split(/\r?\n/)
    .map((item) => item.replace(/\*\*/g, '').trim())
    .find((item) =>
      labels.some((label) =>
        item.toLowerCase().startsWith(`${label.toLowerCase()}:`)
      )
    );

  if (!line) return '';

  return line
    .slice(line.indexOf(':') + 1)
    .trim()
    .split(/\s+[—–-]\s+/)[0]
    .trim();
}

export default function MoodSaaS() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();

  const [isPremium] = useState(false);
  const [loadingPaywall, setLoadingPaywall] = useState(false);

  const userMessagesCount = messages.filter(
    (message) => message.role === 'user'
  ).length;
  const isLocked = userMessagesCount >= 3 && !isPremium;

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');

  const latestAssistantText =
    latestAssistantMessage?.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') ?? '';

  const book = extractRecommendation(latestAssistantText, ['Book']);
  const place = extractRecommendation(latestAssistantText, [
    'Place',
    'Travel Location',
  ]);
  const song = extractRecommendation(latestAssistantText, ['Song']);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLocked) return;

    try {
      await sendMessage({ text: input });
      setInput('');
    } catch (error) {
      console.error('Chat error:', error);
      alert('AI connection error. Please try again.');
    }
  };

  const handleUpgrade = async () => {
    setLoadingPaywall(true);

    try {
      const response = await fetch('/api/checkout', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error('Checkout URL was not returned');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setLoadingPaywall(false);
      alert('Checkout is unavailable. Please try again later.');
    }
  };

  const recommendationCards = [
    {
      kind: 'book' as const,
      label: 'A book',
      value: book,
      colors: 'bg-[#e7defc] text-[#665094]',
      href: book
        ? `https://www.amazon.se/s?k=${encodeURIComponent(book)}&i=stripbooks`
        : '',
      destination: 'Amazon Books',
    },
    {
      kind: 'travel' as const,
      label: 'A place',
      value: place,
      colors: 'bg-[#fce3d5] text-[#a86652]',
      href: place
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
        : '',
      destination: 'Google Maps',
    },
    {
      kind: 'music' as const,
      label: 'A sound',
      value: song,
      colors: 'bg-[#dcebe8] text-[#477a73]',
      href: song
        ? `https://open.spotify.com/search/${encodeURIComponent(song)}`
        : '',
      destination: 'Spotify',
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5f1] text-[#202438]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full bg-[#dfd8fa] opacity-60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#f9ddc9] opacity-60 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#242842] text-xl text-white shadow-lg shadow-[#242842]/15">
              ✦
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">VibeCheck</p>
              <p className="text-xs tracking-wide text-[#777b8b]">
                FIND YOUR NEXT THING
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[#dedce5] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#686b7d]">
            A little inspiration, on demand
          </span>
        </header>

        <div className="mt-9 grid items-stretch gap-7 lg:mt-12 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="flex flex-col justify-between rounded-[2rem] bg-[#252945] p-7 text-white shadow-2xl shadow-[#252945]/15 sm:p-10">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-[#e9e5ff]">
                YOUR MOOD IS THE STARTING POINT
              </span>

              <h1 className="mt-7 max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Feel something.
                <br />
                <span className="text-[#d9c9ff]">Find something.</span>
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-[#c9cbe0] sm:text-base">
                Tell us what is on your mind. Get a book to disappear into,
                somewhere to dream about, and a sound for the moment.
              </p>
            </div>

            <div className="relative my-9 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#a998dc] via-[#d7bad8] to-[#f4c5a9] p-6 shadow-inner sm:my-12">
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[24px] border-white/20"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 left-12 h-48 w-48 rounded-full bg-white/20 blur-sm"
              />
              <div className="relative flex min-h-48 flex-col justify-between">
                <span className="text-sm font-medium text-[#302b4a]">
                  A mood can take you places.
                </span>
                <div className="flex items-end justify-between">
                  <span className="text-7xl drop-shadow-xl sm:text-8xl">
                    ✦
                  </span>
                  <span className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-[#433951] backdrop-blur">
                    Explore your vibe ↗
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {recommendationCards.map(
                ({ kind, label, value, colors, href, destination }) => {
                  const cardContent = (
                    <>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors}`}
                      >
                        <RecommendationIcon kind={kind} />
                      </div>
                      <p className="mt-3 text-xs font-medium text-[#f1effa] sm:text-sm">
                        {label}
                      </p>
                      {value && (
                        <p className="mt-1 break-words text-[11px] leading-4 text-[#d3d0e2]">
                          {value} ↗
                        </p>
                      )}
                    </>
                  );

                  const cardClass =
                    'block min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 transition hover:bg-white/20';

                  return href ? (
                    <a
                      key={kind}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Find ${value} on ${destination}`}
                      className={cardClass}
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div key={kind} className={cardClass}>
                      {cardContent}
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[2rem] border border-[#e8e5e4] bg-white/90 shadow-2xl shadow-[#353553]/10 backdrop-blur sm:min-h-[700px]">
            <div className="flex items-center gap-3 border-b border-[#efedf0] px-6 py-5 sm:px-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eee8fb] text-xl text-[#7256ab]">
                ✦
              </div>
              <div>
                <h2 className="font-semibold">Your mood match</h2>
                <p className="text-xs text-[#888b99]">
                  Books, places and music picked for you
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-white to-[#faf9fd] px-5 py-6 sm:px-8">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-[#ede4ff] to-[#fce6dc] text-4xl shadow-lg shadow-[#9c87ba]/10">
                    ✧
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">
                    What is your mood today?
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#858897]">
                    Excited, uncertain, peaceful, or a mix of everything.
                    Start wherever you are.
                  </p>
                </div>
              )}

              {messages.map((message) => {
                const text = message.parts
                  .filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('');

                return (
                  <div
                    key={message.id}
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm sm:max-w-[85%] ${
                      message.role === 'user'
                        ? 'ml-auto rounded-br-md bg-[#514a89] text-white'
                        : 'mr-auto rounded-bl-md border border-[#e8e5ef] bg-white text-[#34364b]'
                    }`}
                  >
                    <span
                      className={`mb-1 block text-[11px] font-semibold uppercase tracking-wider ${
                        message.role === 'user'
                          ? 'text-[#e4ddff]'
                          : 'text-[#8c75b2]'
                      }`}
                    >
                      {message.role === 'user' ? 'You' : 'Your match'}
                    </span>
                    <div className="whitespace-pre-wrap">
                      {formatMessage(text)}
                    </div>
                  </div>
                );
              })}

              {isLocked && (
                <div className="rounded-2xl border border-[#e8d9ac] bg-[#fff9e9] p-5 text-center">
                  <p className="font-semibold text-[#6e5324]">
                    Your free matches are complete
                  </p>
                  <p className="mt-1 text-sm text-[#8d7752]">
                    Upgrade for more mood matches.
                  </p>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={loadingPaywall}
                    className="mt-4 w-full rounded-xl bg-[#252945] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#3a3f66] disabled:opacity-60"
                  >
                    {loadingPaywall
                      ? 'Opening checkout...'
                      : 'Get Premium Access ($5/mo)'}
                  </button>
                </div>
              )}
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="flex gap-3 border-t border-[#efedf0] bg-white p-4 sm:p-6"
            >
              <input
                className="min-w-0 flex-1 rounded-xl border border-[#e1dfe9] bg-[#fbfafc] px-4 py-3 text-sm text-[#202438] outline-none transition placeholder:text-[#a1a2ad] focus:border-[#8c78bf] focus:ring-4 focus:ring-[#8c78bf]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                value={input}
                placeholder={
                  isLocked
                    ? 'Please upgrade to continue...'
                    : 'How are you feeling?'
                }
                onChange={(event) => setInput(event.target.value)}
                disabled={isLocked}
              />
              <button
                type="submit"
                disabled={isLocked || !input.trim()}
                className="rounded-xl bg-[#514a89] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3e386d] disabled:cursor-not-allowed disabled:bg-[#c9c5d5]"
              >
                Send
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
