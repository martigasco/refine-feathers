import { feathers } from '@feathersjs/feathers'
import rest from '@feathersjs/rest-client'
import axios from 'axios'
import authentication from '@feathersjs/authentication-client'
import Cookies from "js-cookie";

export const feathersInstance = (baseUrl: string) => {

  const app = feathers()

  // Connect to a different URL
  const restClient = rest(baseUrl)

  // Configure an AJAX library with that client
  app.configure(restClient.axios(axios))
  app.configure(authentication())

  app.reAuthenticate().catch(e => {
    Cookies.remove("auth", { path: "/" });
  })

  return app;

};