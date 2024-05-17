'use strict';

const axios =require('axios');

const BASE_URL = process.env.BASE_URL || 'http://home.zanzcc.com:7001';
const request= axios.create({
  baseURL : BASE_URL,
  timeout: 5000,
})
request.interceptors.response.use(
  response=>{
    if(response.status ===200 ){
      return response.data
    }else{
      return response.data
    }
  },
  err=>{
    return Promise.reject(err)
  }
)
module.exports = request;