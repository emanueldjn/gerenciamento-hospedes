import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Stack,
  Chip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  MeetingRoom as RoomIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/',
      gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
      color: '#10b981',
    },
    { 
      text: 'Reservas', 
      icon: <EventIcon />, 
      path: '/reservas',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #a78bfa 100%)',
      color: '#3b82f6',
    },
    { 
      text: 'Clientes', 
      icon: <PeopleIcon />, 
      path: '/clientes',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ec4899 100%)',
      color: '#ff6b6b',
    },
    { 
      text: 'Quartos', 
      icon: <RoomIcon />, 
      path: '/quartos',
      gradient: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
      color: '#f97316',
    },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Logo */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
            }}
          >
            <HotelIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: '1.25rem' }}>
              Pousada
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
              Manager Pro
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, '& > *': { mb: 1 } }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  ...(isActive && {
                    background: `${item.color}15`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: '60%',
                      background: item.gradient,
                      borderRadius: '0 4px 4px 0',
                    },
                  }),
                  '&:hover': {
                    background: isActive ? `${item.color}20` : `${item.color}08`,
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 40,
                    color: isActive ? item.color : 'text.secondary',
                    '& svg': {
                      fontSize: 22,
                      transition: 'all 0.2s',
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.9375rem',
                    color: isActive ? item.color : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Profile Card */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            AD
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
              Admin
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              admin@pousada.com
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'text.primary',
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Search Bar */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: 3,
              px: 2,
              py: 1,
              width: 300,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: '#e5e7eb',
              },
              '&:focus-within': {
                backgroundColor: 'white',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
              },
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            <input
              type="text"
              placeholder="Buscar..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                fontSize: '0.9375rem',
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right Actions */}
          <Stack direction="row" spacing={1}>
            <IconButton
              sx={{
                color: 'text.primary',
                '&:hover': { backgroundColor: '#f3f4f6' },
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Chip
              label="Online"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 28,
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#ffffff',
              borderRight: '1px solid #f3f4f6',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#ffffff',
              borderRight: '1px solid #f3f4f6',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#fafafa',
        }}
      >
        <Toolbar />
        <Box sx={{ mt: 3 }} className="fade-in">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
