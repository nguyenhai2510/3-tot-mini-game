import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Play, Spin } from '../types/type';

export const BaseUrl = 'https://chuoicuahangsuabatot.winwingroup.vn/api/';
export const BaseUrlImage = 'https://chuoicuahangsuabatot.winwingroup.vn/'; // <-- cần có dòng này

export const BaseApi: AxiosInstance = axios.create({
    baseURL: BaseUrl,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

const apis = {
    play: {
        countPlay: (body: { phone: string }) => BaseApi.post<Play>('nutifood/count-play', body),
        spin: (body: { phone: string }) => BaseApi.post<Spin>('nutifood/spin', body),
    },
};

export default apis;