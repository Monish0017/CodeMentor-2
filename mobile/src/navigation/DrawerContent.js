import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  useTheme,
  Title,
  Caption,
  Paragraph,
  Drawer,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useAppTheme, themeStyles } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function DrawerContent(props) {
  const { userData, signOut } = useAuth();
  const { theme } = useAppTheme();
  const paperTheme = useTheme();
  
  // Handle logout
  const handleSignOut = async () => {
    try {
      await signOut();
      
      // Navigate to the auth screen
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <View style={styles.userInfoSection}>
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#6200EE',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{color: 'white', fontSize: 20}}>
              {(userData?.name || 'User').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Title style={styles.title}>{userData?.name || 'User'}</Title>
          <Caption style={styles.caption}>{userData?.email || 'user@example.com'}</Caption>
          <View style={styles.row}>
            <View style={styles.section}>
              <Paragraph style={[styles.paragraph, styles.caption]}>
                {userData?.problemsSolved || '0'}
              </Paragraph>
              <Caption style={styles.caption}>Problems</Caption>
            </View>
            <View style={styles.section}>
              <Paragraph style={[styles.paragraph, styles.caption]}>
                {userData?.interviewsCompleted || '0'}
              </Paragraph>
              <Caption style={styles.caption}>Interviews</Caption>
            </View>
          </View>
        </View>

        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="home-outline" color={color} size={size} />
            )}
            label="Dashboard"
            onPress={() => props.navigation.navigate('Dashboard')}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="code-tags" color={color} size={size} />
            )}
            label="Coding Problems"
            onPress={() => props.navigation.navigate('Coding Problems')}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="account-voice" color={color} size={size} />
            )}
            label="AI Interview"
            onPress={() => props.navigation.navigate('AI Interview')}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="trophy-outline" color={color} size={size} />
            )}
            label="Leaderboard"
            onPress={() => props.navigation.navigate('Leaderboard')}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="bell-outline" color={color} size={size} />
            )}
            label="Notifications"
            onPress={() => props.navigation.navigate('Notifications')}
          />
        </Drawer.Section>

        <Drawer.Section>
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="exit-to-app" color={color} size={size} />
            )}
            label="Sign Out"
            onPress={handleSignOut}
          />
        </Drawer.Section>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
    paddingTop: 20,
  },
  title: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  paragraph: {
    fontWeight: 'bold',
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 15,
  },
});