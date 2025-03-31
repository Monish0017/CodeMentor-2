import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CodeIcon from '@mui/icons-material/Code';

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(120deg, #e0f7fa 0%, #bbdefb 100%)',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: 3,
          bgcolor: 'white',
          boxShadow: 1,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ fontSize: 36, color: 'primary.main', mr: 2 }} />
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              CodeMentor
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container 
        component="main" 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          py: 6 
        }}
      >
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Hero Section */}
          <Grid item xs={12} md={12} sx={{ mb: 4, textAlign: 'center' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                py: 5, 
                px: 4, 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2
              }}
            >
              <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Welcome to CodeMentor
              </Typography>
              <Typography variant="h6" color="textSecondary" paragraph sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
                Your one-stop platform for coding practice, mentorship, and job opportunities.
                Choose your role to get started.
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={6} md={5}>
                  <Card 
                    elevation={4}
                    sx={{
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
                      <PersonIcon sx={{ fontSize: 70, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                        Student Login
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        Access your coding problems, track progress, and participate in mentoring sessions.
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 4 }}>
                      <Button 
                        component={Link} 
                        to="/auth/login" 
                        variant="contained" 
                        size="large"
                        sx={{ 
                          borderRadius: 6,
                          px: 4,
                          py: 1.5
                        }}
                      >
                        Login as Student
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={5}>
                  <Card 
                    elevation={4}
                    sx={{
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
                      <AdminPanelSettingsIcon sx={{ fontSize: 70, color: '#ff6d00', mb: 2 }} />
                      <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                        Admin Login
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        Manage students, problems, and job notifications from the admin portal.
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 4 }}>
                      <Button 
                        component={Link} 
                        to="/admin/login" 
                        variant="contained" 
                        color="warning"
                        size="large"
                        sx={{ 
                          borderRadius: 6,
                          px: 4,
                          py: 1.5
                        }}
                      >
                        Login as Admin
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'white',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} CodeMentor. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
