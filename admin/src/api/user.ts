import request from './request'

export const userApi = {
  info: () => request.get('/user/info')
}
