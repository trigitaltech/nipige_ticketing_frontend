import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getWeeklyTasksAPI, saveWeeklyTaskAPI, updateWeeklyTaskAPI } from '../services/weeklyTaskApi';

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

const weeklyTaskSlice = createSlice({
  name: 'weeklyTasks',
  initialState: {
    tasks: [],
    loading: false,
    saving: false,
    error: null,
    success: null,
  },
  reducers: {
    clearWeeklyTaskError: (state) => { state.error = null; },
    clearWeeklyTaskSuccess: (state) => { state.success = null; },
    setWeeklyTasks: (state, action) => { state.tasks = action.payload; },
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
      .addCase(updateWeeklyTask.rejected, (state, action) => { state.saving = false; state.error = action.payload; });
  },
});

export const { clearWeeklyTaskError, clearWeeklyTaskSuccess, setWeeklyTasks } = weeklyTaskSlice.actions;
export default weeklyTaskSlice.reducer;
