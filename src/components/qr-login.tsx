'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { utils } from '@kinda/utils';

const QrLogin = () => {
	const router = useRouter();
	const [qrCode, setQrCode] = useState<string>();
	const [scanSuccess, setScanSuccess] = useState<string>();
	const [timeLeft, setTimeLeft] = useState<number | null>(null);

	const generateQrCode = async (code: string) => {
		const codeData = JSON.parse(code);
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		headers.append('API-KEY', 'f80c0983-3357-4bfc-b634-79fa6f66b82e');
		const options: any = {
			method: 'POST', // *GET, POST, PUT, DELETE, etc.
			mode: 'cors', // no-cors, *cors, same-origin
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			credentials: 'same-origin', // include, *same-origin, omit
			headers: headers,
			redirect: 'follow', // manual, *follow, error
			referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		};
		const data = { data: code };
		options.body = JSON.stringify({ ...data });
		const response = await fetch(
			'https://api.uniapi.top/image/qr_code/generate',
			options
		);
		const backData = await response.json();
		setQrCode(backData.url);

		setTimeLeft(codeData.data.expires_in);

		const interval = setInterval(() => {
			setTimeLeft((prevTime) => {
				// 确保 prevTime 为有效数字，避免为 null
				const updatedTime = prevTime != null ? prevTime - 1 : 0;

				if (updatedTime <= 0) {
					clearInterval(interval); // 如果倒计时结束，清除定时器
					return 0;
				}

				return updatedTime;
			});
		}, 1000);
	};

	useEffect(() => {
		const socket = new WebSocket('ws://localhost:8000/login');
		// Connection opened
		socket.addEventListener('open', (event) => {
			console.log('[ WebSocket连接 ] ' + 'ws://localhost:8000/login');
			const message = {
				action: 'require',
				data: 'code',
			};
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify(message));
			}
		});

		// Listen for messages from the server
		socket.addEventListener('message', async (event) => {
			console.log('[ WebSocket接收到数据 ] ' + event.data);
			JSON.parse(event.data).action === 'login' && generateQrCode(event.data);
			JSON.parse(event.data).action === 'scan' &&
				JSON.parse(event.data).data === 'success' &&
				setScanSuccess('success');
			if (JSON.parse(event.data).action === 'auth') {
				const { data } = JSON.parse(event.data);
				Cookies.set('access_token', data.access_token, {
					expires: data.expires_in / 1000,
				});
				Cookies.set('refresh_token', data.refresh_token);
				console.log('登录成功，即将跳转到主页');
				await utils.sleep(1000);
				router.push('/dashboard');
			}
		});

		// Connection closed
		socket.addEventListener('close', (event) => {
			console.log('[ WebSocket关闭 ] ' + event);
		});
		return () => socket.close();
	}, []);
	return (
		<div className='flex justify-center items-center p-5 flex-col'>
			{!qrCode && (
				<div className='aspect-square rounded flex justify-center items-center w-[250px]'>
					二维码加载中
					<span className='ml-3 relative flex h-3 w-3'>
						<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75'></span>
						<span className='relative inline-flex rounded-full h-3 w-3 bg-sky-500'></span>
					</span>
				</div>
			)}
			{qrCode && (
				<div style={{ width: 250, height: 250 }} className='relative'>
					<Image
						src={qrCode}
						alt='qrcode'
						width={250}
						height={250}
						className='rounded overflow-hidden'
					/>
					{scanSuccess === 'failed' && (
						<div className='bg-cyan-100/50 dark:bg-gray-600/50 shadow backdrop-blur-md absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center w-full h-full rounded'>
							<div className='rounded px-5 py-2 shadow bg-white/50 dark:bg-black/50'>
								授权失败
							</div>
						</div>
					)}
					{scanSuccess === 'success' && (
						<div className='bg-cyan-100/50 dark:bg-gray-600/50 shadow backdrop-blur-md absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center w-full h-full rounded'>
							<div className='rounded px-5 py-2 shadow bg-white/50 dark:bg-black/50 text-xs'>
								已扫码，等待授权
							</div>
						</div>
					)}
					{timeLeft !== null && timeLeft <= 0 && (
						<div className='bg-cyan-100/50 dark:bg-gray-600/50 shadow backdrop-blur-md absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center w-full h-full rounded'>
							<div className='rounded px-5 py-2 shadow bg-yellow/50 dark:bg-black/50 text-xs'>
								二维码已过期，请刷新页面重新获取
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default QrLogin;
