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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tab,
  Tabs,
  Box,
  Chip,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';    // Fixed import
import SearchIcon from '@mui/icons-material/Search';
import { SERVERURL, getAuthHeader, handleApiError } from '../../utils/api';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProblemManagement = () => {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [newProblem, setNewProblem] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    category: 'Arrays', // Updated default category
    tags: [],
    companies: [], // Added companies array
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', output: '', isHidden: false }], // Added isHidden
    constraints: '',
    solution: '', // Added solution field
    hints: [], // Added hints array
    isPublic: true
  });
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [newTag, setNewTag] = useState('');
  const [newCompany, setNewCompany] = useState(''); // Added for company tags
  const [newHint, setNewHint] = useState(''); // Added for hints
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch problems from backend
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${SERVERURL}/api/admin/problems`, {
          headers: getAuthHeader()
        });
        
        if (response.data.success) {
          setProblems(response.data.data);
          setFilteredProblems(response.data.data);
        } else {
          setError('Failed to fetch problems');
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
        // Specifically handle 403 errors
        if (error.response && error.response.status === 403) {
          setError('You do not have permission to access this resource. Please make sure you are logged in with admin privileges.');
        } else {
          setError(handleApiError(error));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    if (newValue === 0) {
      // All problems tab
      filterProblems(searchTerm);
    } else {
      // Filter by difficulty
      const difficultyMap = {
        1: 'Easy',
        2: 'Medium',
        3: 'Hard'
      };
      
      const filtered = problems.filter(problem => 
        problem.difficulty === difficultyMap[newValue] && 
        (searchTerm === '' || 
          problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          problem.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
      
      setFilteredProblems(filtered);
    }
  };

  const filterProblems = (term) => {
    if (term.trim() === '') {
      setFilteredProblems(problems);
    } else {
      const filtered = problems.filter(problem => 
        problem.title.toLowerCase().includes(term.toLowerCase()) ||
        problem.tags?.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredProblems(filtered);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterProblems(term);
  };

  const handleDeleteClick = (problem) => {
    setSelectedProblem(problem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProblem) {
      try {
        const response = await axios.delete(`${SERVERURL}/api/admin/problems/${selectedProblem._id}`, {
          headers: getAuthHeader()
        });
        
        if (response.data.success) {
          // Remove the deleted problem from state
          const updatedProblems = problems.filter(prob => prob._id !== selectedProblem._id);
          setProblems(updatedProblems);
          setFilteredProblems(updatedProblems);
          
          setAlertMessage(`Problem "${selectedProblem.title}" has been deleted successfully`);
          setAlertSeverity('success');
        } else {
          setAlertMessage(response.data.message || 'Failed to delete problem');
          setAlertSeverity('error');
        }
      } catch (error) {
        console.error('Delete problem error:', error);
        if (error.response && error.response.status === 403) {
          setAlertMessage('You do not have permission to delete problems. Please make sure you have admin privileges.');
        } else {
          setAlertMessage(handleApiError(error));
        }
        setAlertSeverity('error');
      }
      
      setAlertOpen(true);
    }
    setDeleteDialogOpen(false);
    setSelectedProblem(null);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewProblem({
      title: '',
      description: '',
      difficulty: 'Easy',
      category: 'Arrays', // Updated default category
      tags: [],
      companies: [], // Added companies array
      examples: [{ input: '', output: '', explanation: '' }],
      testCases: [{ input: '', output: '', isHidden: false }], // Added isHidden
      constraints: '',
      solution: '', // Added solution field
      hints: [], // Added hints array
      isPublic: true
    });
    setNewTag('');
    setNewCompany('');
    setNewHint('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProblem({ ...newProblem, [name]: value });
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!newProblem.tags.includes(newTag.trim())) {
        setNewProblem({
          ...newProblem,
          tags: [...newProblem.tags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setNewProblem({
      ...newProblem,
      tags: newProblem.tags.filter(tag => tag !== tagToDelete)
    });
  };

  const handleCompanyKeyDown = (e) => {
    if (e.key === 'Enter' && newCompany.trim()) {
      e.preventDefault();
      if (!newProblem.companies.includes(newCompany.trim())) {
        setNewProblem({
          ...newProblem,
          companies: [...newProblem.companies, newCompany.trim()]
        });
      }
      setNewCompany('');
    }
  };

  const handleHintKeyDown = (e) => {
    if (e.key === 'Enter' && newHint.trim()) {
      e.preventDefault();
      if (!newProblem.hints.includes(newHint.trim())) {
        setNewProblem({
          ...newProblem,
          hints: [...newProblem.hints, newHint.trim()]
        });
      }
      setNewHint('');
    }
  };

  const handleDeleteCompany = (companyToDelete) => {
    setNewProblem({
      ...newProblem,
      companies: newProblem.companies.filter(company => company !== companyToDelete)
    });
  };

  const handleDeleteHint = (hintToDelete) => {
    setNewProblem({
      ...newProblem,
      hints: newProblem.hints.filter(hint => hint !== hintToDelete)
    });
  };

  // Handle example input/output changes
  const handleExampleChange = (index, field, value) => {
    const updatedExamples = [...newProblem.examples];
    updatedExamples[index][field] = value;
    setNewProblem({ ...newProblem, examples: updatedExamples });
  };

  // Add new example
  const addExample = () => {
    setNewProblem({
      ...newProblem,
      examples: [...newProblem.examples, { input: '', output: '', explanation: '' }]
    });
  };

  // Remove example
  const removeExample = (index) => {
    if (newProblem.examples.length > 1) {
      const updatedExamples = [...newProblem.examples];
      updatedExamples.splice(index, 1);
      setNewProblem({ ...newProblem, examples: updatedExamples });
    }
  };

  // Handle test case input/output changes
  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...newProblem.testCases];
    if (field === 'isHidden') {
      updatedTestCases[index][field] = !updatedTestCases[index][field];
    } else {
      updatedTestCases[index][field] = value;
    }
    setNewProblem({ ...newProblem, testCases: updatedTestCases });
  };

  // Add new test case
  const addTestCase = () => {
    setNewProblem({
      ...newProblem,
      testCases: [...newProblem.testCases, { input: '', output: '', isHidden: false }]
    });
  };

  // Remove test case
  const removeTestCase = (index) => {
    if (newProblem.testCases.length > 1) {
      const updatedTestCases = [...newProblem.testCases];
      updatedTestCases.splice(index, 1);
      setNewProblem({ ...newProblem, testCases: updatedTestCases });
    }
  };

  const handleAddProblem = async () => {
    // Validation
    if (!newProblem.title || !newProblem.description || 
        !newProblem.category || !newProblem.difficulty) {
      setAlertMessage('Please fill in all required fields');
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    // Validate examples
    if (newProblem.examples.some(ex => !ex.input || !ex.output)) {
      setAlertMessage('All examples must have input and output');
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    // Validate test cases
    if (newProblem.testCases.some(tc => !tc.input || !tc.output)) {
      setAlertMessage('All test cases must have input and output');
      setAlertSeverity('error');
      setAlertOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${SERVERURL}/api/admin/problems`, newProblem, {
        headers: getAuthHeader()
      });
      
      if (response.data.success) {
        const addedProblem = response.data.data;
        
        // Add the new problem to state
        const updatedProblems = [...problems, addedProblem];
        setProblems(updatedProblems);
        setFilteredProblems(updatedProblems);
        
        setAlertMessage(`Problem "${addedProblem.title}" has been added successfully`);
        setAlertSeverity('success');
        handleDialogClose();
      } else {
        setAlertMessage(response.data.message || 'Failed to add problem');
        setAlertSeverity('error');
      }
    } catch (error) {
      console.error('Add problem error:', error);
      if (error.response && error.response.status === 403) {
        setAlertMessage('You do not have permission to add problems. Please make sure you have admin privileges.');
      } else {
        setAlertMessage(handleApiError(error));
      }
      setAlertSeverity('error');
    }
    
    setAlertOpen(true);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
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
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="error">
            Access Error
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1" paragraph>
            This may be due to one of the following reasons:
          </Typography>
          <ul>
            <li>Your login session has expired</li>
            <li>You don't have administrator privileges</li>
            <li>The server is experiencing issues</li>
          </ul>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.href = '/login'}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Problem Management
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Add, view, and manage coding problems for students.
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="All Problems" />
            <Tab label="Easy" />
            <Tab label="Medium" />
            <Tab label="Hard" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Search problems"
                  placeholder="Search by title or topic"
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
                Add New Problem
              </Button>
            </Grid>
          </Grid>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {filteredProblems.length > 0 ? (
              filteredProblems.map(problem => (
                <Grid item xs={12} key={problem._id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="h6">{problem.title}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                            <Chip 
                              label={problem.difficulty} 
                              color={getDifficultyColor(problem.difficulty)} 
                              size="small" 
                            />
                            {problem.tags?.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {problem.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(problem)}
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
                    No problems found matching your search criteria.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Easy problems - content is filtered in handleTabChange */}
          <Grid container spacing={3}>
            {filteredProblems.length > 0 ? (
              filteredProblems.map(problem => (
                <Grid item xs={12} key={problem._id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="h6">{problem.title}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                            <Chip 
                              label={problem.difficulty} 
                              color={getDifficultyColor(problem.difficulty)} 
                              size="small" 
                            />
                            {problem.tags?.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {problem.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(problem)}
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
                    No easy problems found matching your search criteria.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Medium problems - content is filtered in handleTabChange */}
          <Grid container spacing={3}>
            {filteredProblems.length > 0 ? (
              filteredProblems.map(problem => (
                <Grid item xs={12} key={problem._id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="h6">{problem.title}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                            <Chip 
                              label={problem.difficulty} 
                              color={getDifficultyColor(problem.difficulty)} 
                              size="small" 
                            />
                            {problem.tags?.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {problem.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(problem)}
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
                    No medium problems found matching your search criteria.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Hard problems - content is filtered in handleTabChange */}
          <Grid container spacing={3}>
            {filteredProblems.length > 0 ? (
              filteredProblems.map(problem => (
                <Grid item xs={12} key={problem._id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="h6">{problem.title}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                            <Chip 
                              label={problem.difficulty} 
                              color={getDifficultyColor(problem.difficulty)} 
                              size="small" 
                            />
                            {problem.tags?.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {problem.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(problem)}
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
                    No hard problems found matching your search criteria.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Add Problem Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Problem</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="title"
                label="Problem Title"
                fullWidth
                value={newProblem.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={newProblem.difficulty}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={newProblem.category}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Arrays">Arrays</MenuItem>
                  <MenuItem value="Strings">Strings</MenuItem>
                  <MenuItem value="Linked Lists">Linked Lists</MenuItem>
                  <MenuItem value="Trees">Trees</MenuItem>
                  <MenuItem value="Graphs">Graphs</MenuItem>
                  <MenuItem value="Dynamic Programming">Dynamic Programming</MenuItem>
                  <MenuItem value="Sorting">Sorting</MenuItem>
                  <MenuItem value="Searching">Searching</MenuItem>
                  <MenuItem value="Hash Tables">Hash Tables</MenuItem>
                  <MenuItem value="Recursion">Recursion</MenuItem>
                  <MenuItem value="Math">Math</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Problem Description"
                fullWidth
                multiline
                rows={6}
                value={newProblem.description}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="constraints"
                label="Constraints"
                fullWidth
                multiline
                rows={3}
                value={newProblem.constraints}
                onChange={handleInputChange}
                helperText="Specify constraints like time/space complexity or input limitations"
              />
            </Grid>
            
            {/* Tags Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Tags and Metadata
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Add Tags (Press Enter to add)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                helperText="Tags help categorize problems"
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {newProblem.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Add Companies (Press Enter to add)"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                onKeyDown={handleCompanyKeyDown}
                helperText="Companies that use this problem"
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {newProblem.companies.map((company, index) => (
                  <Chip
                    key={index}
                    label={company}
                    onDelete={() => handleDeleteCompany(company)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  name="isPublic"
                  value={newProblem.isPublic}
                  onChange={(e) => setNewProblem({ ...newProblem, isPublic: e.target.value })}
                >
                  <MenuItem value={true}>Public</MenuItem>
                  <MenuItem value={false}>Private</MenuItem>
                </Select>
                <FormHelperText>Public problems are visible to all students</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Examples Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Examples
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {newProblem.examples.map((example, index) => (
              <Grid item xs={12} key={`example-${index}`}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">Example {index + 1}</Typography>
                    {newProblem.examples.length > 1 && (
                      <IconButton 
                        size="small" 
                        onClick={() => removeExample(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Input"
                        multiline
                        rows={3}
                        value={example.input}
                        onChange={(e) => handleExampleChange(index, 'input', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Output"
                        multiline
                        rows={3}
                        value={example.output}
                        onChange={(e) => handleExampleChange(index, 'output', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Explanation"
                        multiline
                        rows={2}
                        value={example.explanation}
                        onChange={(e) => handleExampleChange(index, 'explanation', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={addExample}
                fullWidth
              >
                Add Another Example
              </Button>
            </Grid>
            
            {/* Test Cases Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Test Cases
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {newProblem.testCases.map((testCase, index) => (
              <Grid item xs={12} key={`testcase-${index}`}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">Test Case {index + 1}</Typography>
                    {newProblem.testCases.length > 1 && (
                      <IconButton 
                        size="small" 
                        onClick={() => removeTestCase(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Input"
                        multiline
                        rows={3}
                        value={testCase.input}
                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Expected Output"
                        multiline
                        rows={3}
                        value={testCase.output}
                        onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={testCase.isHidden}
                            onChange={() => handleTestCaseChange(index, 'isHidden')}
                          />
                        }
                        label="Hidden test case (not visible to students)"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={addTestCase}
                fullWidth
              >
                Add Another Test Case
              </Button>
            </Grid>
            
            {/* Solution and Hints Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Solution and Hints
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="solution"
                label="Solution (Reference Solution)"
                fullWidth
                multiline
                rows={6}
                value={newProblem.solution}
                onChange={handleInputChange}
                helperText="Provide a reference solution (not visible to students)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Add Hints (Press Enter to add)"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                onKeyDown={handleHintKeyDown}
                helperText="Hints help students when they're stuck"
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {newProblem.hints.map((hint, index) => (
                  <Chip
                    key={index}
                    label={hint}
                    onDelete={() => handleDeleteHint(hint)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAddProblem} variant="contained" color="primary">
            Add Problem
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Problem</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProblem?.title}"? This action cannot be undone.
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

export default ProblemManagement;
