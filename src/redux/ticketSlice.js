import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getTicketsAPI, createTicketAPI, updateTicketAPI, deleteTicketAPI } from '../services/api';

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getTicketsAPI();
      // Extract the data array from the response
      return response.data || response || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch tickets'
      );
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await createTicketAPI(ticketData);
      // Extract the ticket data from the response
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create ticket'
      );
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const response = await updateTicketAPI(ticketId, ticketData);
      // Extract the ticket data from the response
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update ticket'
      );
    }
  }
);

export const deleteTicket = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await deleteTicketAPI(ticketId);
      return { ticketId, ...response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete ticket'
      );
    }
  }
);

const initialState = {
  tickets: [],
  loading: false,
  error: null,
  success: null,
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearTicketError: (state) => {
      state.error = null;
    },
    clearTicketSuccess: (state) => {
      state.success = null;
    },
    // Optimistic update for status change
    updateTicketStatusOptimistic: (state, action) => {
      const { ticketId, newStatus } = action.payload;
      const index = state.tickets.findIndex(
        (ticket) => (ticket._id || ticket.id) === ticketId
      );
      if (index !== -1) {
        state.tickets[index] = { ...state.tickets[index], status: newStatus };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
        state.error = null;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        // Handle the new ticket - it might be a single ticket object
        if (action.payload && (action.payload._id || action.payload.id)) {
          state.tickets.push(action.payload);
        }
        state.success = 'Ticket created successfully';
        state.error = null;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.loading = false;
        // Find and update the ticket in the array
        const updatedTicket = action.payload;
        if (updatedTicket && (updatedTicket._id || updatedTicket.id)) {
          const ticketId = updatedTicket._id || updatedTicket.id;
          const index = state.tickets.findIndex(
            (ticket) => (ticket._id || ticket.id) === ticketId
          );
          if (index !== -1) {
            state.tickets[index] = updatedTicket;
          }
        }
        state.success = 'Ticket updated successfully';
        state.error = null;
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = state.tickets.filter(
          (ticket) => ticket.id !== action.payload.ticketId && ticket._id !== action.payload.ticketId
        );
        state.success = 'Ticket deleted successfully';
        state.error = null;
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTicketError, clearTicketSuccess, updateTicketStatusOptimistic } = ticketSlice.actions;
export default ticketSlice.reducer;
