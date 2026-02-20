import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from "bun:test";
import { findOrCreateUser } from "./user";

// Mock the prisma client
const mockPrisma = {
  user: {
    findUnique: mock(),
    create: mock(),
    update: mock(),
  },
};

// Mock lib/db module
mock.module("@/lib/db", () => {
  return {
    prisma: mockPrisma,
  };
});

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = mock();
global.fetch = mockFetch;

// Mock environment variables
process.env.AUTH0_DOMAIN = "test.auth0.com";

describe("findOrCreateUser optimization", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.create.mockReset();
    mockPrisma.user.update.mockReset();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it("should fetch avatar if user has none (null)", async () => {
    // Setup: User exists but has null avatar
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "1",
      auth0Id: "auth0|123",
      email: "test@example.com",
      avatarUrl: null,
      profileCompleted: true,
    });

    // Mock fetch to return a picture
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ picture: "http://new-pic.com" }),
    });

    await findOrCreateUser({
      sub: "auth0|123",
      email: "test@example.com",
      accessToken: "token",
    });

    // Expect fetch to be called
    expect(mockFetch).toHaveBeenCalled();

    // Verify update happens with the new picture
    expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ avatarUrl: "http://new-pic.com" })
    }));
  });

  it("should NOT fetch avatar if user has empty string avatar (optimized behavior)", async () => {
    // Setup: User exists and has empty string avatar (meaning checked & none found)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "1",
      auth0Id: "auth0|123",
      email: "test@example.com",
      avatarUrl: "",
      profileCompleted: true,
    });

    await findOrCreateUser({
      sub: "auth0|123",
      email: "test@example.com",
      accessToken: "token",
    });

    // Expect fetch NOT to be called (This will fail before optimization)
    // Currently, the code fetches if avatarUrl is empty string because of trim().length === 0 check
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should update avatar to empty string if fetch returns nothing (optimized behavior)", async () => {
     // Setup: User exists but has null avatar
     mockPrisma.user.findUnique.mockResolvedValue({
      id: "1",
      auth0Id: "auth0|123",
      email: "test@example.com",
      avatarUrl: null,
      profileCompleted: true,
    });

    // Mock fetch to return NO picture (empty object or 404, here empty object with no picture property)
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
    });

    await findOrCreateUser({
      sub: "auth0|123",
      email: "test@example.com",
      accessToken: "token",
    });

    // Expect fetch to be called
    expect(mockFetch).toHaveBeenCalled();

    // Expect update with empty string (This will fail before optimization)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ avatarUrl: "" })
    }));
  });

  it("should use empty string for avatarUrl when creating new user if fetch returns nothing", async () => {
      // Setup: User does not exist
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock fetch to return NO picture
      mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({}),
      });

      // Mock create to return the created user
      mockPrisma.user.create.mockResolvedValue({
          id: "2",
          auth0Id: "auth0|456",
          email: "new@example.com",
          avatarUrl: "",
          profileCompleted: false,
      });

      await findOrCreateUser({
        sub: "auth0|456",
        email: "new@example.com",
        accessToken: "token",
      });

      expect(mockFetch).toHaveBeenCalled();

      // Verify create call uses "" for avatarUrl instead of undefined/null
      expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ avatarUrl: "" })
      }));
  });
});
