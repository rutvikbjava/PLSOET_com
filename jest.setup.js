// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill React.cache for Jest environment
// React 18's cache() is a server-only API that's not available in jsdom
// We provide a simple implementation for testing purposes
const React = require('react');
if (!React.cache) {
  React.cache = function(fn) {
    // In tests, cache() just returns the function without caching
    // This preserves the function signature while avoiding caching complexity in tests
    return fn;
  };
}

// Polyfill Web APIs for Edge Runtime (middleware) tests
// Next.js middleware runs in Edge runtime which has Web APIs (Request, Response, etc.)
// Jest's jsdom environment doesn't include these by default
if (typeof global.Request === 'undefined') {
  // Using node-fetch or similar would be ideal, but for structural tests we can use minimal mocks
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.cookies = {
        get: (name) => null,
        set: () => {},
      };
    }
  };
  
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'content-type': 'application/json', ...init?.headers },
      });
    }
    static redirect(url, status = 302) {
      return new Response(null, { status, headers: { location: url } });
    }
  };
  
  global.Headers = class Headers extends Map {
    append(name, value) {
      this.set(name, value);
    }
    delete(name) {
      super.delete(name);
    }
    get(name) {
      return super.get(name) || null;
    }
  };
}
