import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProjectsAPI, createProjectAPI, updateProjectAPI, deleteProjectAPI } from '../services/projectApi';

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getProjectsAPI();
      return response?.data || response || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch projects'
      );
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await createProjectAPI(projectData);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create project'
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ projectId, projectData }, { rejectWithValue }) => {
    try {
      const response = await updateProjectAPI(projectId, projectData);
      return { projectId, data: response?.data || response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update project'
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      await deleteProjectAPI(projectId);
      return projectId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete project'
      );
    }
  }
);

const initialState = {
  projects: [],
  loading: false,
  error: null,
  success: null,
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
    },
    clearProjectSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch projects';
      })
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        const createdProject = action.payload;
        if (createdProject && (createdProject._id || createdProject.id)) {
          state.projects = [createdProject, ...state.projects];
        }
        state.success = 'Project created successfully';
        state.error = null;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create project';
      })
      .addCase(updateProject.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const { projectId, data } = action.payload;
        const idx = state.projects.findIndex((p) => (p._id || p.id) === projectId);
        if (idx !== -1 && data) {
          state.projects[idx] = { ...state.projects[idx], ...data };
        }
        state.success = 'Project updated successfully';
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update project';
      })
      .addCase(deleteProject.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(
          (p) => (p._id || p.id) !== action.payload
        );
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete project';
      });
  },
});

export const { clearProjectError, clearProjectSuccess } = projectSlice.actions;
export default projectSlice.reducer;
