import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './App.css';

function App() {
  const [waitTime, setWaitTime] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [queuePosition, setQueuePosition] = useState(null);
  const [editAppointment, setEditAppointment] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  //fetch wait time
  const fetchWaitTime = async () => {
    const response = await fetch('http://localhost:5000/api/wait-time');
    const data = await response.json();
    setWaitTime(data.waitTime);
  };

  //fetch appointments
  const fetchAppointments = async () => {
    const response = await fetch('http://localhost:5000/api/appointments');
    const data = await response.json();
    setAppointments(data);
  };

  //update wait time
  const updateWaitTime = async () => {
    const newWaitTime = prompt('Enter new wait time (in minutes):');
    if (newWaitTime !== null) {
      await fetch('http://localhost:5000/api/wait-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newWaitTime: parseInt(newWaitTime) }),
      });
      fetchWaitTime();
    }
  };

  //add appointment
const addAppointment = async () => {
  if (!patientName || !appointmentTime) {
    alert('Please fill in all fields');
    return;
  }

  const selectedTime = new Date(appointmentTime);
  const currentTime = new Date();

  //check if the appointment time is in the past
  if (selectedTime < currentTime) {
    alert('Appointment time cannot be in the past');
    return;
  }

  //check if the appointment time is already taken
  const isTimeTaken = appointments.some((appt) => appt.time === appointmentTime);
  if (isTimeTaken) {
    alert('Appointment time is already taken');
    return;
  }

  const response = await fetch('http://localhost:5000/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientName, time: appointmentTime }),
  });

  if (response.ok) {
    setPatientName('');
    setAppointmentTime('');
    fetchAppointments();
  } else {
    const errorData = await response.json();
    alert(errorData.error);
  }
};

  //delete appointment
  const deleteAppointment = async (id) => {
    await fetch(`http://localhost:5000/api/appointments/${id}`, {
      method: 'DELETE',
    });
    fetchAppointments();
  };

  //open edit dialog
  const handleEditClick = (appointment) => {
    setEditAppointment(appointment);
    setOpenEditDialog(true);
  };

  //close edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditAppointment(null);
  };

  //save edited appointment
const saveEditedAppointment = async () => {
  if (!editAppointment.patientName || !editAppointment.time) {
    alert('Please fill in all fields');
    return;
  }

  const selectedTime = new Date(editAppointment.time);
  const currentTime = new Date();

  //check if the appointment time is in the past
  if (selectedTime < currentTime) {
    alert('Appointment time cannot be in the past');
    return;
  }

  //check if the appointment time is already taken (excluding the current appointment being edited)
  const isTimeTaken = appointments.some(
    (appt) => appt.time === editAppointment.time && appt.id !== editAppointment.id
  );
  if (isTimeTaken) {
    alert('Appointment time is already taken');
    return;
  }

  await fetch(`http://localhost:5000/api/appointments/${editAppointment.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: editAppointment.patientName,
      time: editAppointment.time,
    }),
  });
  fetchAppointments();
  handleCloseEditDialog();
};

  //notify patient arrival
  const notifyArrival = async () => {
    if (!patientName) {
      alert('Please enter your name');
      return;
    }
    const response = await fetch('http://localhost:5000/api/arrive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName }),
    });
    const data = await response.json();
    setQueuePosition(data.position);
  };

  //get queue position
  const getQueuePosition = async () => {
    if (!patientName) {
      alert('Please enter your name');
      return;
    }
    const response = await fetch(`http://localhost:5000/api/queue-position/${patientName}`);
    const data = await response.json();
    if (data.error) {
      alert(data.error);
    } else {
      setQueuePosition(data.position);
    }
  };

  //format date to hide the year
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  useEffect(() => {
    fetchWaitTime();
    fetchAppointments();
  }, []);

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Clinic Management Portal</Typography>
        </Toolbar>
      </AppBar>

      <Container>
        <Box mt={4}>
          <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
            <Typography variant="h6">Current Wait Time: {waitTime} minutes</Typography>
            <Button variant="contained" color="primary" onClick={updateWaitTime} style={{ marginTop: '10px' }}>
              Update Wait Time
            </Button>
          </Paper>

          <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
            <Typography variant="h6">Appointments</Typography>
            <Box mt={2}>
              <TextField
                label="Patient Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Appointment Time"
                type="datetime-local"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0, 16) }} //disable past dates
              />
              <Button variant="contained" color="primary" onClick={addAppointment} style={{ marginTop: '10px' }}>
                Add Appointment
              </Button>
            </Box>
            <List>
              {appointments.map((appt) => (
                <ListItem key={appt.id} divider>
                  <ListItemText primary={`${appt.patientName} - ${formatDate(appt.time)}`} />
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(appt)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => deleteAppointment(appt.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper elevation={3} style={{ padding: '20px' }}>
            <Typography variant="h6">Queue Management</Typography>
            <Box mt={2}>
              <Button variant="contained" color="primary" onClick={notifyArrival} style={{ marginRight: '10px' }}>
                Notify Arrival
              </Button>
              <Button variant="contained" color="secondary" onClick={getQueuePosition}>
                Check Queue Position
              </Button>
              {queuePosition && (
                <Typography variant="body1" style={{ marginTop: '10px' }}>
                  Your position in the queue: {queuePosition}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>

      
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Appointment</DialogTitle>
        <DialogContent>
          <TextField
            label="Patient Name"
            value={editAppointment?.patientName || ''}
            onChange={(e) => setEditAppointment({ ...editAppointment, patientName: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Appointment Time"
            type="datetime-local"
            value={editAppointment?.time || ''}
            onChange={(e) => setEditAppointment({ ...editAppointment, time: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().slice(0, 16) }} //disabled past dates
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={saveEditedAppointment} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;