import React from 'react';
import { TrackedStockItem } from '../../types/stock';
import { Calendar, Plus } from 'lucide-react';

export function TrackingEventsCard(props: {
  activeTracked: TrackedStockItem;
  isAddEventOpen: boolean;
  setIsAddEventOpen: (value: boolean) => void;
  handleAddEvent: (e: React.FormEvent) => void;
  newEventTitle: string;
  setNewEventTitle: (value: string) => void;
  newEventDate: string;
  setNewEventDate: (value: string) => void;
  newEventNote: string;
  setNewEventNote: (value: string) => void;
}) {
  const {
    activeTracked, isAddEventOpen, setIsAddEventOpen, handleAddEvent,
    newEventTitle, setNewEventTitle, newEventDate, setNewEventDate, newEventNote, setNewEventNote,
  } = props;
  return (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>关键催化节点与事件追踪日历</span>
                </div>
                <button
                  onClick={() => setIsAddEventOpen(!isAddEventOpen)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddEventOpen ? '收起' : '添加事件'}</span>
                </button>
              </div>

              {isAddEventOpen && (
                <form onSubmit={handleAddEvent} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">事件名称 / 催化主题</label>
                      <input
                        type="text"
                        placeholder="如: 三季度财报发布会、海外产线落地..."
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">预计日期</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">跟踪要点与预期影响</label>
                    <input
                      type="text"
                      placeholder="重点观察指标或预期驱动逻辑..."
                      value={newEventNote}
                      onChange={(e) => setNewEventNote(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddEventOpen(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                    >
                      确定添加
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5">
                {activeTracked.upcomingEvents?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{ev.title}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                            {ev.date}
                          </span>
                        </div>
                        {ev.note && <p className="text-slate-400 text-[11px] mt-1">{ev.note}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
  );
}
