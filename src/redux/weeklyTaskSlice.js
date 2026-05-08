import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getWeeklyTasksAPI, saveWeeklyTaskAPI, updateWeeklyTaskAPI, getWeeklyTicketsAPI } from '../services/weeklyTaskApi';

export const fetchWeeklyTasks = createAsyncThunk(
  'weeklyTasks/fetchWeeklyTasks',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getWeeklyTasksAPI(params);
      return response.data || response || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch weekly tasks');
    }
  }
);

export const saveWeeklyTask = createAsyncThunk(
  'weeklyTasks/saveWeeklyTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await saveWeeklyTaskAPI(taskData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save weekly task');
    }
  }
);

export const updateWeeklyTask = createAsyncThunk(
  'weeklyTasks/updateWeeklyTask',
  async ({ taskId, taskData }, { rejectWithValue }) => {
    try {
      const response = await updateWeeklyTaskAPI(taskId, taskData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update weekly task');
    }
  }
);

export const fetchWeeklyTickets = createAsyncThunk(
  'weeklyTasks/fetchWeeklyTickets',
  async (params, { rejectWithValue }) => {
    try {
      const projectIds = Array.isArray(params?.projects) ? params.projects : null;
      const assigneeIds = Array.isArray(params?.assignees) ? params.assignees : null;
      const hasMultiProjects = projectIds && projectIds.length > 0;
      const hasMultiAssignees = assigneeIds && assigneeIds.length > 0;

      if (hasMultiProjects || hasMultiAssignees) {
        const { projects: _p, assignees: _a, ...rest } = params;
        let combos = [{}];
        if (hasMultiProjects) {
          combos = projectIds.map(id => ({ project: id }));
        }
        if (hasMultiAssignees) {
          const expanded = [];
          combos.forEach(c => {
            assigneeIds.forEach(uid => expanded.push({ ...c, assignTo: uid }));
          });
          combos = expanded;
        }
        const responses = await Promise.all(
          combos.map(c => getWeeklyTicketsAPI({ ...rest, ...c }))
        );
        const seen = new Set();
        const merged = [];
        responses.forEach(res => {
          const list = Array.isArray(res?.data) ? res.data : [];
          list.forEach(t => {
            const id = t._id || t.id;
            if (id && !seen.has(id)) {
              seen.add(id);
              merged.push(t);
            }
          });
        });
        return merged;
      }

      const response = await getWeeklyTicketsAPI(params);
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

const weeklyTaskSlice = createSlice({
  name: 'weeklyTasks',
  initialState: {
    tasks: [],
    loading: false,
    saving: false,
    error: null,
    success: null,
    weeklyTickets: [],
    weeklyTicketsLoading: false,
  },
  reducers: {
    clearWeeklyTaskError: (state) => { state.error = null; },
    clearWeeklyTaskSuccess: (state) => { state.success = null; },
    setWeeklyTasks: (state, action) => { state.tasks = action.payload; },
    updateWeeklyTicketStatusOptimistic: (state, action) => {
      const { ticketId, newStatus } = action.payload;
      const ticket = state.weeklyTickets.find(t => (t._id || t.id) === ticketId);
      if (ticket) ticket.status = newStatus;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeeklyTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWeeklyTasks.fulfilled, (state, action) => { state.loading = false; state.tasks = action.payload; })
      .addCase(fetchWeeklyTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(saveWeeklyTask.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(saveWeeklyTask.fulfilled, (state) => { state.saving = false; state.success = 'Weekly task saved successfully'; })
      .addCase(saveWeeklyTask.rejected, (state, action) => { state.saving = false; state.error = action.payload; })
      .addCase(updateWeeklyTask.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateWeeklyTask.fulfilled, (state) => { state.saving = false; state.success = 'Weekly task updated successfully'; })
      .addCase(updateWeeklyTask.rejected, (state, action) => { state.saving = false; state.error = action.payload; })
      .addCase(fetchWeeklyTickets.pending, (state) => { state.weeklyTicketsLoading = true; state.weeklyTickets = []; })
      .addCase(fetchWeeklyTickets.fulfilled, (state, action) => { state.weeklyTicketsLoading = false; state.weeklyTickets = action.payload; })
      .addCase(fetchWeeklyTickets.rejected, (state) => { state.weeklyTicketsLoading = false; });
  },
});

export const { clearWeeklyTaskError, clearWeeklyTaskSuccess, setWeeklyTasks, updateWeeklyTicketStatusOptimistic } = weeklyTaskSlice.actions;
export default weeklyTaskSlice.reducer;
