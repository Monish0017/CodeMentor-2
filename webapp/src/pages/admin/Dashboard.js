import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Paper,
  CardActions
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

const Dashboard = () => {
  const adminModules = [
    {
      title: 'Student Management',
      description: 'View and manage student profiles, track progress and delete students.',
      icon: <PersonIcon sx={{ fontSize: 50, color: '#3f51b5' }} />,
      link: '/admin/students',
      color: '#e3f2fd'
    },
    {
      title: 'Problem Management',
      description: 'Add, view, and manage coding problems for students.',
      icon: <CodeIcon sx={{ fontSize: 50, color: '#4caf50' }} />,
      link: '/admin/problems',
      color: '#e8f5e9'
    },
    {
      title: 'Job Notifications',
      description: 'Post and manage job opportunities and notifications.',
      icon: <NotificationsIcon sx={{ fontSize: 50, color: '#ff9800' }} />,
      link: '/admin/notifications',
      color: '#fff3e0'
    },
    {
      title: 'Analytics',
      description: 'View statistics and performance metrics of students.',
      icon: <LeaderboardIcon sx={{ fontSize: 50, color: '#e91e63' }} />,
      link: '/admin/analytics',
      color: '#fce4ec'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Welcome to the admin portal. Manage students, problems, and job notifications from here.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {adminModules.map((module, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: module.color,
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {module.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  {module.title}
                </Typography>
                <Typography variant="body1" color="textSecondary" align="center">
                  {module.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  component={Link} 
                  to={module.link} 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    borderRadius: 2,
                    px: 4 
                  }}
                >
                  Manage
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;
