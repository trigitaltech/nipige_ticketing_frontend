import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { saveWeeklyTaskAPI } from '../services/weeklyTaskApi';
import { fetchProjects } from '../redux/projectSlice';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import '../assets/Styles/WeeklyTasks.css';

const STATUS_OPTIONS = [
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

const TIME_FORMAT_REGEX = /^\s*(\d+\s*[hH])?\s*(\d+\s*[mM])?\s*$/;

const isValidTime = (val) => {
  if (!val) return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (!/[hHmM]/.test(trimmed)) return false;
  return TIME_FORMAT_REGEX.test(trimmed);
};

const sanitizeTimeInput = (val) => val.replace(/[^\dhHmM\s]/g, '');

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
    empty[i] = { projectNames: '', workDescription: '', time: '', status: '' };
  }
  return empty;
};

const WeeklyTasks = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState(createEmptyWeekData());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

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
      time: weekData[i]?.time || '',
      status: weekData[i]?.status || '',
    })).filter(e => e.projectNames || e.workDescription || e.time || e.status);

    if (entries.length === 0) {
      toast.warning('Please fill in at least one day before saving.');
      return;
    }

    const hasInvalidTime = entries.some((e) => !isValidTime(e.time));
    if (hasInvalidTime) {
      toast.error('Invalid time format. Use e.g. "2h 30m", "1H 15M", "5h", or "45m".');
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek(-1)}
            title="Previous Week"
            aria-label="Previous Week"
          >
            <span className="week-nav-chevron">‹</span>
          </Button>
          <span className="week-label">{weekStart} &mdash; {weekEnd}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek(1)}
            title="Next Week"
            aria-label="Next Week"
          >
            <span className="week-nav-chevron">›</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
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
                  <div className="project-select-wrapper">
                    <Select
                      value={weekData[i]?.projectNames || ''}
                      onValueChange={(val) => updateCell(i, 'projectNames', val)}
                    >
                      <SelectTrigger className="project-select-trigger">
                        <SelectValue placeholder="Project" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(projects) && projects.length > 0 ? (
                          projects.map((p) => {
                            const id = p._id || p.id;
                            const name = p.name || p.projectName || 'Untitled';
                            return (
                              <SelectItem key={id} value={name}>
                                {name}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <div className="project-select-empty">No projects</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
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

            {/* Row 4: Time */}
            <tr>
              <td className="row-label row-label-time">Time</td>
              {weekDates.map((_, i) => {
                const timeValue = weekData[i]?.time || '';
                const invalid = !isValidTime(timeValue);
                return (
                  <td key={i} className="data-cell">
                    <input
                      type="text"
                      className={`cell-input cell-input-time ${invalid ? 'cell-input-invalid' : ''}`}
                      placeholder="e.g. 2h 30m"
                      value={timeValue}
                      onChange={(e) => updateCell(i, 'time', sanitizeTimeInput(e.target.value))}
                      title="Format: 2h 30m, 1H 15M, 5h, or 45m"
                    />
                  </td>
                );
              })}
            </tr>

            {/* Row 5: Project Status */}
            <tr>
              <td className="row-label row-label-status">Project Status</td>
              {weekDates.map((_, i) => (
                <td key={i} className="data-cell">
                  <div className="status-select-wrapper">
                    <Select
                      value={weekData[i]?.status || ''}
                      onValueChange={(val) => updateCell(i, 'status', val)}
                    >
                      <SelectTrigger
                        className={`status-select-trigger ${getStatusClass(weekData[i]?.status)}`}
                      >
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="weekly-save-bar">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="weekly-save-btn"
        >
          {saving ? (
            <Loader2 className="weekly-save-icon animate-spin" />
          ) : (
            <Save className="weekly-save-icon" />
          )}
          {saving ? 'Saving...' : 'Save Weekly Tasks'}
        </Button>
      </div>
    </div>
  );
};

export default WeeklyTasks;
