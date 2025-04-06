import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';     // Fixed import
import SearchIcon from '@mui/icons-material/Search'; // Fixed import
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { SERVERURL, getAuthHeader, handleApiError } from '../../utils/api';

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [newNotification, setNewNotification] = useState({
    company: '',
    title: '',
    description: '',
    location: '',
    type: 'Full-time',
    salary: '',
    applicationLink: '',
    lastDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days from now
    requirements: []
  });
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch job notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${SERVERURL}/api/admin/jobs`, {
          headers: getAuthHeader()
        });
        
        if (response.data.success) {
          setNotifications(response.data.data);
          setFilteredNotifications(response.data.data);
        } else {
          setError('Failed to fetch job notifications');
        }
      } catch (error) {
        console.error('Error fetching job notifications:', error);
        setError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredNotifications(notifications);
    } else {
      const filtered = notifications.filter(notification => 
        notification.title?.toLowerCase().includes(term.toLowerCase()) ||
        notification.company?.toLowerCase().includes(term.toLowerCase()) ||
        notification.location?.toLowerCase().includes(term.toLowerCase()) ||
        notification.type?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredNotifications(filtered);
    }
  };

  const handleDeleteClick = (notification) => {
    setSelectedNotification(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedNotification) {
      try {
        const response = await axios.delete(`${SERVERURL}/api/admin/jobs/${selectedNotification._id}`, {
          headers: getAuthHeader()
        });
        
        if (response.data.success) {
          // Remove the deleted notification from state
          const updatedNotifications = notifications.filter(notif => notif._id !== selectedNotification._id);
          setNotifications(updatedNotifications);
          setFilteredNotifications(updatedNotifications);
          
          setAlertMessage(`Job notification for "${selectedNotification.title}" has been deleted successfully`);
          setAlertSeverity('success');
        } else {
          setAlertMessage(response.data.message || 'Failed to delete job notification');
          setAlertSeverity('error');
        }
      } catch (error) {
        console.error('Delete job notification error:', error);
        setAlertMessage(handleApiError(error));
        setAlertSeverity('error');
      }
      
      setAlertOpen(true);
    }
    setDeleteDialogOpen(false);
    setSelectedNotification(null);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewNotification({
      company: '',
      title: '',
      description: '',
      location: '',
      type: 'Full-time',
      salary: '',
      applicationLink: '',
      lastDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days from now
      requirements: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNotification({ ...newNotification, [name]: value });
  };

  const handleAddNotification = async () => {
    if (!newNotification.title || !newNotification.company || !newNotification.description) {
      setAlertMessage('Please fill in all required fields');
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${SERVERURL}/api/admin/job`, newNotification, {
        headers: getAuthHeader()
      });
      
      if (response.data.success) {
        const addedNotification = response.data.data;
        
        // Add the new notification to state
        const updatedNotifications = [...notifications, addedNotification];
        setNotifications(updatedNotifications);
        setFilteredNotifications(updatedNotifications);
        
        setAlertMessage(`Job notification for "${addedNotification.title}" has been added successfully`);
        setAlertSeverity('success');
        handleDialogClose();
      } else {
        setAlertMessage(response.data.message || 'Failed to add job notification');
        setAlertSeverity('error');
      }
    } catch (error) {
      console.error('Add job notification error:', error);
      setAlertMessage(handleApiError(error));
      setAlertSeverity('error');
    }
    
    setAlertOpen(true);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Job Notifications
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Manage job opportunities and notifications for students. Add new listings, view current openings, and remove outdated titles.
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              <TextField
                fullWidth
                variant="outlined"
                label="Search job notifications"
                placeholder="Search by title, company, or location"
                value={searchTerm}
                onChange={handleSearch}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button 
              startIcon={<AddIcon />} 
              variant="contained" 
              color="primary"
              onClick={handleDialogOpen}
            >
              Add New Job
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <Grid item xs={12} key={notification._id}>
              <Card 
                elevation={2}
                sx={{
                  title: 'relative',
                  overflow: 'visible',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                  }
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h6">{notification.title}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 0.5 }}>
                        <BusinessIcon fontSize="small" sx={{ mr: 0.75, color: 'primary.main' }} />
                        <Typography variant="subtitle1" color="primary.main">
                          {notification.company}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {notification.location || 'Remote'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WorkIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {notification.type || 'Full-time'}
                          </Typography>
                        </Box>
                        {notification.salary && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {notification.salary}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {notification.description}
                      </Typography>
                      <Chip 
                        label={`Apply by: ${new Date(notification.lastDate).toLocaleDateString()}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ mt: 1, mr: 1 }}
                      />
                      <Chip 
                        label={`Posted: ${new Date(notification.createdAt).toLocaleDateString()}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(notification)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No job notifications found matching your search criteria.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Job Notification Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Job Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="title"
                label="Job Title"
                fullWidth
                value={newNotification.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="company"
                label="Company"
                fullWidth
                value={newNotification.company}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="location"
                label="Location"
                fullWidth
                value={newNotification.location}
                onChange={handleInputChange}
                placeholder="City, State or Remote"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  name="type"
                  value={newNotification.type}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Internship">Internship</MenuItem>
                  <MenuItem value="Freelance">Freelance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="salary"
                label="Salary Range"
                fullWidth
                value={newNotification.salary}
                onChange={handleInputChange}
                placeholder="e.g. $80,000 - $100,000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastDate"
                label="Application Deadline"
                type="date"
                fullWidth
                value={newNotification.lastDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="applicationLink"
                label="Application Link"
                fullWidth
                value={newNotification.applicationLink}
                onChange={handleInputChange}
                placeholder="https://example.com/careers/apply"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Job Description"
                fullWidth
                multiline
                rows={6}
                value={newNotification.description}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAddNotification} variant="contained" color="primary">
            Add Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Job Notification</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the job posting for "{selectedNotification?.title}" at "{selectedNotification?.company}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
        <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationManagement;
