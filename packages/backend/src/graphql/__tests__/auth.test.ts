import { gql } from "apollo-server-express";

// GraphQL queries and mutations for testing
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        role
      }
      expiresIn
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      message
      timestamp
    }
  }
`;

export const VALIDATE_TOKEN_QUERY = gql`
  query ValidateToken {
    validateToken {
      valid
      user {
        id
        username
        role
      }
      timestamp
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      role
    }
  }
`;

// Example test cases (you can expand these with actual test implementations)
describe("GraphQL Auth Resolvers", () => {
  // These are placeholder tests - implement with your testing framework
  test("should login with valid credentials", () => {
    // Test login mutation
  });

  test("should reject invalid credentials", () => {
    // Test login with wrong password
  });

  test("should validate token", () => {
    // Test token validation
  });

  test("should logout successfully", () => {
    // Test logout mutation
  });
});
