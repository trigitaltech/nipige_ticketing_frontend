import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { saveWeeklyTaskAPI } from '../services/weeklyTaskApi';
import '../assets/Styles/WeeklyTasks.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Select Status' },
  { value: 'On Going', label: 'On Going' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'On Hold', label: 'On Hold' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getWeekDates = (baseDate) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDate = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const getStatusClass = (status) => {
  switch (status) {
    case 'On Going': return 'status-ongoing';
    case 'Completed': return 'status-completed';
    case 'Not Started': return 'status-not-started';
    case 'On Hold': return 'status-on-hold';
    default: return '';
  }
};

const createEmptyWeekData = () => {
  const empty = {};
  for (let i = 0; i < 7; i++) {
    empty[i] = { projectNames: '', workDescription: '', status: '' };
  }
  return empty;
};

const WeeklyTasks = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState(createEmptyWeekData());
  const [saving, setSaving] = useState(false);

  const weekDates = getWeekDates(currentDate);
  const today = new Date();

  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  const navigateWeek = useCallback((direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + direction * 7);
      return d;
    });
    setWeekData(createEmptyWeekData());
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setWeekData(createEmptyWeekData());
  }, []);

  const updateCell = useCallback((dayIndex, field, value) => {
    setWeekData(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], [field]: value },
    }));
  }, []);

  const handleSave = async () => {
    const currentUser = user?.response?.user || user;
    const entries = weekDates.map((date, i) => ({
      date: date.toISOString(),
      projectNames: weekData[i]?.projectNames || '',
      workDescription: weekData[i]?.workDescription || '',
      status: weekData[i]?.status || '',
    })).filter(e => e.projectNames || e.workDescription || e.status);

    if (entries.length === 0) {
      toast.warning('Please fill in at least one day before saving.');
      return;
    }

    setSaving(true);
    try {
      await saveWeeklyTaskAPI({
        userId: currentUser?._id,
        userName: currentUser?.authentication?.userName || `${currentUser?.name?.first || ''} ${currentUser?.name?.last || ''}`.trim(),
        weekStartDate: weekDates[0].toISOString(),
        weekEndDate: weekDates[6].toISOString(),
        entries,
      });
      toast.success('Weekly tasks saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save weekly tasks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="weekly-tasks-container">
      {/* Header */}
      <div className="weekly-tasks-header">
        <h2>Weekly Tasks</h2>
        <div className="week-navigation">
          <button className="week-nav-btn" onClick={() => navigateWeek(-1)} title="Previous Week">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="week-label">{weekStart} &mdash; {weekEnd}</span>
          <button className="week-nav-btn" onClick={() => navigateWeek(1)} title="Next Week">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button className="week-today-btn" onClick={goToToday}>Today</button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="weekly-grid-wrapper">
        <table className="weekly-grid">
          <tbody>
            {/* Row 1: Dates */}
            <tr>
              <td className="row-label row-label-date">Date</td>
              {weekDates.map((date, i) => (
                <td key={i} className={`date-cell ${isSameDay(date, today) ? 'today' : ''}`}>
                  {formatDate(date)}
                  <div className="date-day">{DAYS[date.getDay()]}</div>
                </td>
              ))}
            </tr>

            {/* Row 2: Project Names */}
            <tr>
              <td className="row-label row-label-project">Project Name</td>
              {weekDates.map((_, i) => (
                <td key={i} className="data-cell">
                  <textarea
                    className="cell-input"
                    placeholder="Enter project names..."
                    value={weekData[i]?.projectNames || ''}
                    onChange={(e) => updateCell(i, 'projectNames', e.target.value)}
                    rows={3}
                  />
                </td>
              ))}
            </tr>

            {/* Row 3: Work Description */}
            <tr>
              <td className="row-label row-label-description">Work Description</td>
              {weekDates.map((_, i) => (
                <td key={i} className="data-cell">
                  <textarea
                    className="cell-input"
                    placeholder="Describe work done..."
                    value={weekData[i]?.workDescription || ''}
                    onChange={(e) => updateCell(i, 'workDescription', e.target.value)}
                    rows={4}
                  />
                </td>
              ))}
            </tr>

            {/* Row 4: Project Status */}
            <tr>
              <td className="row-label row-label-status">Project Status</td>
              {weekDates.map((_, i) => (
                <td key={i} className="data-cell">
                  <div className="status-select-wrapper">
                    <select
                      className={`status-select ${getStatusClass(weekData[i]?.status)}`}
                      value={weekData[i]?.status || ''}
                      onChange={(e) => updateCell(i, 'status', e.target.value)}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="weekly-save-bar">
        <button className="weekly-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.416" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Weekly Tasks
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WeeklyTasks;
