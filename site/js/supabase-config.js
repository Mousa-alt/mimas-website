/**
 * mima's — Supabase Client Configuration
 *
 * The anon key below is PUBLIC by design. It is safe to expose in frontend code.
 * All data access is protected by Row Level Security (RLS) policies on the database.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://uvrsebljdricjcwputfo.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cnNlYmxqZHJpY2pjd3B1dGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODI2MzksImV4cCI6MjA4OTY1ODYzOX0.lGRy0Tp46KHI93IyX0EPoG4zoIVwH6hTn-_JbTSbul0';

  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.warn('[mimas] Supabase JS library not loaded. Auth and order features disabled.');
    window.__supabase = null;
    return;
  }

  window.__supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
