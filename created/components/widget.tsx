
import { useState } from 'react';

export default function OneQWidget() {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const options = [];
  let t

  const handleSubmit = async () => {
    if(!answer) return;
    await fetch('https://survey-delta-one.vercel.app/api/surveys/c94cb407-cc29-46fc-9e0e-7ed122627a31/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 400, margin: 'auto', padding: 16, border: '2px solid #6366f133', borderRadius: 16, textAlign: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>How was your experience?</div>
      {t === 'text' ? (
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer…" style={{ width: '100%', padding: 12, border: '2px solid #6366f1', borderRadius: 8 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: t==='multiple'?'column':'row', gap: 8, justifyContent: 'center' }}>
          {options.map(o => (
            <button key={o} onClick={() => setAnswer(o)} style={{ border: '2px solid #6366f1', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', backgroundColor: answer===o?'#6366f1':'white', color: answer===o?'white':'#6366f1' }}>
              {o}
            </button>
          ))}
        </div>
      )}
      <button onClick={handleSubmit} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, fontWeight: 600, backgroundColor: '#6366f1', color: 'white', cursor: 'pointer' }}>
        Submit
      </button>
      {submitted && <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>Thanks for responding!</div>}
    </div>
  );
}
  