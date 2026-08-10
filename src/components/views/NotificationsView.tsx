import React from 'react';
import { Bell, CheckCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-slate-900">Notifications & Alerts</h2>
          <p className="text-sm text-[#cbc3d7] light:text-slate-500">
            System activity alerts, budget threshold warnings, and savings updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#d0bcff] font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-[#cbc3d7] space-y-2">
            <Bell className="w-10 h-10 text-[#cbc3d7]/40 mx-auto" />
            <p className="text-sm font-medium">No alerts available at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notification_id}
              className={`p-4 rounded-2xl border transition-colors flex items-start gap-3.5 ${
                !n.is_read
                  ? 'bg-white/10 border-[#d0bcff]/40 shadow-[0_0_15px_rgba(208,188,255,0.15)]'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  !n.is_read ? 'bg-[#d0bcff] text-[#3c0091]' : 'bg-white/10 text-[#cbc3d7]'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white light:text-slate-900 leading-relaxed">
                  {n.message}
                </p>
                <span className="text-[10px] text-[#cbc3d7] light:text-slate-500 mt-1 block">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
