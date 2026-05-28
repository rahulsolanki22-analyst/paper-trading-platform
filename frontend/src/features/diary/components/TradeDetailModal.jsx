import React, { useState } from "react";
import { X, Upload, Save, Star } from "lucide-react";
import { updateDiaryTrade, uploadScreenshot } from "@/api/diaryApi";

const EMOTIONS = [
  "FOMO", "Greed", "Revenge Trade", "Emotional Buy", "Emotional Sell",
  "Late Entry", "Panic Sell", "Technical Analysis", "Breakout Trade",
  "Scalping", "Swing Trade", "News Reaction", "Random Entry",
  "Confidence Trade", "Stop Loss Hit"
];

export default function TradeDetailModal({ trade, onClose, onSave }) {
  const [notes, setNotes] = useState(trade?.notes || "");
  const [rating, setRating] = useState(trade?.rating || 0);
  const [tags, setTags] = useState(trade?.emotion_tags || []);
  const [screenshotPath, setScreenshotPath] = useState(trade?.screenshot_path || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!trade) return null;

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const res = await uploadScreenshot(file);
      setScreenshotPath(res.path);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateDiaryTrade(trade.id, {
        notes,
        rating,
        emotion_tags: tags,
        screenshot_path: screenshotPath
      });
      onSave(updated);
      onClose();
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save trade details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold">{trade.symbol} Trade Details</h2>
            <p className="text-sm text-gray-500">
              {trade.trade_type} • {trade.status} • PnL: <span className={trade.pnl > 0 ? 'text-emerald-600' : 'text-red-600'}>{trade.pnl > 0 ? '+' : ''}₹{trade.pnl?.toFixed(2) || '0.00'}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {/* Psychology Tags */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Trading Psychology & Setup</h3>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => toggleTag(emotion)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    tags.includes(emotion) 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {/* Trade Discipline Rating */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Discipline Rating (1-5)</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`p-1 transition-transform hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-gray-200'}`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Did you follow your strategy? (Not profit-based)</p>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Trade Notes</h3>
            <textarea
              className="w-full rounded-[16px] border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
              rows="4"
              placeholder="e.g. Entered late after breakout candle and panic sold early..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-500">Chart Screenshot</h3>
            
            {screenshotPath ? (
              <div className="relative group rounded-[16px] overflow-hidden border border-gray-200 inline-block">
                <img src={`http://localhost:8000${screenshotPath}`} alt="Trade Screenshot" className="max-h-64 object-contain" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100">
                    Replace Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-[16px] cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload screenshot'}</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
