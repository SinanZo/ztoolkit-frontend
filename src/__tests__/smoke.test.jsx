import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect, describe } from 'vitest';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import ToolsGallery from '../components/ToolsGallery';
import ToolDetails from '../pages/ToolDetails';
import '../i18n';

describe('ZToolKit Frontend Smoke & Component Tests', () => {
  test('Header renders brand and navigation links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('ZToolKit')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tools/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pricing/i })).toBeInTheDocument();
  });

  test('Hero renders title, subtitle and CTA buttons', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse all tools/i })).toBeInTheDocument();
  });

  test('ToolsGallery displays tools and responds to search filtering', () => {
    render(
      <MemoryRouter>
        <ToolsGallery />
      </MemoryRouter>
    );
    expect(screen.getByText('PDF to DOCX')).toBeInTheDocument();
    expect(screen.getByText('QR Code Generator')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent-query-xyz' } });
    expect(screen.getByText(/no tools found/i)).toBeInTheDocument();
  });

  test('ToolDetails displays tool preview status notice and metadata', () => {
    render(
      <MemoryRouter initialEntries={['/tools/pdf-to-docx']}>
        <Routes>
          <Route path="/tools/:id" element={<ToolDetails />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'PDF to DOCX' })).toBeInTheDocument();
    expect(screen.getByText(/phase 1 preview/i)).toBeInTheDocument();
    expect(screen.getByText(/engine under construction/i)).toBeInTheDocument();
  });

  test('ToolDetails displays fallback when tool is not found', () => {
    render(
      <MemoryRouter initialEntries={['/tools/unknown-slug']}>
        <Routes>
          <Route path="/tools/:id" element={<ToolDetails />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/tool not found/i)).toBeInTheDocument();
  });

  test('Footer renders copyright and navigation', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
  });
});
