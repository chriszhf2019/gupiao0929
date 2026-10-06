import React from 'react';
import { TrackedStockItem } from '../../types/stock';
import { Edit3 } from 'lucide-react';

export function TrackingNotesCard(props: {
  activeTracked: TrackedStockItem;
  handleAddNote: (e: React.FormEvent) => void;
  newNoteStage: string;
  setNewNoteStage: (value: string) => void;
  newNoteSentiment: 'bullish' | 'neutral' | 'cautious';
  setNewNoteSentiment: (value: 'bullish' | 'neutral' | 'cautious') => void;
  newNoteContent: string;
  setNewNoteContent: (value: string) => void;
}) {
  const {
    activeTracked, handleAddNote, newNoteStage, setNewNoteStage,
    newNoteSentiment, setNewNoteSentiment, newNoteContent, setNewNoteContent,
  } = props;
  return (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Edit3 className="w-4 h-4" />
                <span>投研跟踪日记与复盘手记 (Research Journal)</span>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="阶段标签 (如: 中报复盘、批价追踪、加仓执行...)"
                    value={newNoteStage}
                    onChange={(e) => setNewNoteStage(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white max-w-xs"
                  />

                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewNoteSentiment('bullish')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        newNoteSentiment === 'bullish'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      看多偏好
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNoteSentiment('neutral')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        newNoteSentiment === 'neutral'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      中性观望
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNoteSentiment('cautious')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        newNoteSentiment === 'cautious'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      谨慎防守
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="记录跟踪心得、财报点评、关键点位触碰观察或仓位决策思考..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    写入跟踪日记
                  </button>
                </div>
              </form>

              {/* Notes Timeline List */}
              <div className="space-y-3 pt-2">
                {activeTracked.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-700 text-[11px]">
                          {note.stage}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">{note.timestamp}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          note.sentiment === 'bullish'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : note.sentiment === 'cautious'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {note.sentiment === 'bullish' ? '看多' : note.sentiment === 'cautious' ? '谨慎' : '中性'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">{note.content}</p>
                  </div>
                ))}
              </div>

            </div>
  );
}
