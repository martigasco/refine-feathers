"use client";

import { feathersInstance } from "@providers/data-provider/feathers";

import { AuthBindings } from "@refinedev/core";
import Cookies from "js-cookie";

const feathers = feathersInstance(process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3030")


export const authProvider: AuthBindings = {
  login: async ({ email, username, password, remember }) => {

    try {
      const user = await feathers.authenticate({
        strategy: 'local',
        email,
        password
      })

      if (user) {
        Cookies.set("auth", JSON.stringify(user), {
          expires: 30, // 30 days
          path: "/",
        });
        return {
          success: true,
          redirectTo: "/",
        };
      } else {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Unknown error",
          },
        };
      }
    } catch (e) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Invalid username or password",
        },
      };
    }

    // if (user) {
    //   Cookies.set("auth", JSON.stringify(user), {
    //     expires: 30, // 30 days
    //     path: "/",
    //   });

    // }


  },
  logout: async () => {
    await feathers.logout()
    Cookies.remove("auth", { path: "/" });
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {

    try {
      const { user, accessToken } = await feathers.get('authentication')
      return {
        authenticated: true,
      };
    } catch (e) {
      Cookies.remove("auth", { path: "/" });
      return {
        authenticated: false,
        logout: true,
        redirectTo: "/login",
      };
    }


  },
  getPermissions: async () => {
    const { user } = await feathers.get('authentication')
    if (user) {
      return user.roles || {};
    }
    return null;
  },
  getIdentity: async () => {
    const { user } = await feathers.get('authentication')
    if (user) {
      return user;
    }
    return null;
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
