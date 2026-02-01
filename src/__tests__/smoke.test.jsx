import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../components/Header';
import { test, expect } from 'vitest';

test('smoke: Header component is defined', () => {
  expect(typeof Header).toBe('function');
});
