const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const readline = require('readline');
const chalk = require('chalk');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class ZerosWalletBot {
    constructor(proxy) {
        this.baseHeaders = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-G9750 Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate',
            'origin': 'https://app.zeroswallet.com',
            'x-requested-with': 'com.zerofeewallet',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://app.zeroswallet.com/',
            'accept-language': 'en-US,en;q=0.9'
        };
        this.token = '';
        this.userId = '';
        this.proxyAgent = proxy ? this.createProxyAgent(proxy) : null;
    }

    createProxyAgent(proxy) {
        try {
            console.log(chalk.blue('Parsing proxy:', proxy));
    
            const protocol = proxy.startsWith('https') ? 'https' : 'http';
    
            const proxyWithoutProtocol = proxy.replace(/^https?:\/\//, '');
    
            const [userPass, hostPort] = proxyWithoutProtocol.split('@');
            if (!userPass || !hostPort) {
                throw new Error('Invalid proxy format. Expected http://user:password@host:port');
            }
    
            const [username, password] = userPass.split(':');
            if (!username || !password) {
                throw new Error('Invalid proxy format. Expected http://user:password@host:port');
            }
    
            const [host, port] = hostPort.split(':');
            if (!host || !port) {
                throw new Error('Invalid proxy format. Expected http://user:password@host:port');
            }
    
            const proxyUrl = `${protocol}://${username}:${password}@${host}:${port}`;
            console.log(chalk.blue('Proxy URL:', proxyUrl)); 
    
            if (proxy.startsWith('socks4') || proxy.startsWith('socks5')) {
                return new SocksProxyAgent(`${proxy.startsWith('socks4') ? 'socks4' : 'socks5'}://${proxyUrl}`);
            } else {
                return new HttpsProxyAgent(proxyUrl);
            }
        } catch (error) {
            console.error(chalk.red('✖️ Error creating proxy agent:'), error.message);
            return null;
        }
    }

    async createWallet() {
        try {
            const response = await axios.post(
                'https://api.zeroswallet.com/createwallet',
                {},
                { 
                    headers: this.baseHeaders, 
                    http2: true,
                    httpsAgent: this.proxyAgent,
                    proxy: false
                }
            );
            
            this.token = response.data.token || '';
            this.userId = response.data.user_id ? response.data.user_id.toString() : '';
            
            return {
                success: true,
                token: this.token,
                userId: this.userId,
                data: response.data
            };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async addReferral(referralCode) {
        try {
            const form = new FormData();
            form.append('refcode', referralCode);
            form.append('token', this.token);

            const response = await axios.post(
                'https://api.zeroswallet.com/addreferral',
                form,
                { 
                    headers: { ...this.baseHeaders, ...form.getHeaders() }, 
                    http2: true,
                    httpsAgent: this.proxyAgent,
                    proxy: false
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async joinAirdrop() {
        try {
            const form = new FormData();
            form.append('token', this.token);
            form.append('id', '10');
            form.append('telegram', '');
            form.append('telegram2', '');
            form.append('twitter', '');
            form.append('twitter2', '');
            form.append('facebook', '');
            form.append('website', '');

            const response = await axios.post(
                'https://api.zeroswallet.com/airdrop-join',
                form,
                { 
                    headers: { ...this.baseHeaders, ...form.getHeaders() }, 
                    http2: true,
                    httpsAgent: this.proxyAgent,
                    proxy: false
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async getQuiz() {
        try {
            const response = await axios.post(
                'https://api.zeroswallet.com/quiz/get',
                {},
                { 
                    headers: this.baseHeaders, 
                    http2: true,
                    httpsAgent: this.proxyAgent,
                    proxy: false
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async answerQuiz() {
        try {
            const form = new FormData();
            form.append('answer', 'Zeros Token');
            form.append('token', this.token);

            const response = await axios.post(
                'https://api.zeroswallet.com/quiz/check',
                form,
                { 
                    headers: { ...this.baseHeaders, ...form.getHeaders() }, 
                    http2: true,
                    httpsAgent: this.proxyAgent,
                    proxy: false
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async getWalletInfo() {
        try {
            const form = new FormData();
            form.append('id', this.userId || '');

            const response = await axios.post(
                'https://api.zeroswallet.com/get/mywallet',
                form,
                { 
                    headers: { ...this.baseHeaders, ...form.getHeaders() }, 
                    http2: true,
                    httpsAgent: this.proxyAgent,
                    proxy: false
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    }

    async saveWallet(walletData) {
        try {
            let wallets = [];
            try {
                const data = await fs.readFile('wallets.json', 'utf8');
                wallets = JSON.parse(data);
            } catch (e) {}
            wallets.push(walletData);
            await fs.writeFile('wallets.json', JSON.stringify(wallets, null, 2));
        } catch (error) {
            console.error(chalk.red('✖ Failed to save wallet:'), error.message);
        }
    }
}

async function loadReferralCodes() {
    try {
        const data = await fs.readFile('code.txt', 'utf8');
        return data.split('\n').map(code => code.trim()).filter(code => code);
    } catch (error) {
        console.error(chalk.red('✖ Error loading code.txt:'), error.message);
        return ['c8d4e2cfe4'];
    }
}

async function loadProxies() {
    try {
        const data = await fs.readFile('proxies.txt', 'utf8');
        return data.split('\n').map(proxy => proxy.trim()).filter(proxy => proxy);
    } catch (error) {
        console.error(chalk.red('✖ Error loading proxies.txt:'), error.message);
        return [];
    }
}

async function runBot(count) {
    console.log(chalk.cyan.bold('======================================='));
    console.log(chalk.cyan.bold('  Auto Reff Zeros - FOREST ARMY   '));
    console.log(chalk.cyan.bold('======================================='));
    console.log(chalk.yellow(`Target: Create ${count} wallets\n`));

    const referralCodes = await loadReferralCodes();
    const proxies = await loadProxies();
    const wallets = [];

    for (let i = 0; i < count; i++) {
        const proxy = proxies[i % proxies.length] || null;
        const refCode = referralCodes[i % referralCodes.length];

        console.log(chalk.cyan(`\n[Wallet ${i + 1}/${count}]`));
        console.log(chalk.gray('------------------------'));
        if (proxy) console.log(chalk.magenta(`Using proxy: ${proxy}`));

        const bot = new ZerosWalletBot(proxy);

        console.log(chalk.yellow('→ Creating wallet...'));
        const walletResult = await bot.createWallet();
        if (!walletResult.success) {
            console.log(chalk.red('✖ Failed:'), walletResult.error);
            continue;
        }
        console.log(chalk.green('✔ Success'), `UserID: ${walletResult.userId}`);

        console.log(chalk.yellow(`→ Adding referral (${refCode})...`));
        const refResult = await bot.addReferral(refCode);
        console.log(refResult.success ? 
            chalk.green('✔ Success') : 
            chalk.red('✖ Failed:'), refResult.success ? refResult.data.success : refResult.error);

        console.log(chalk.yellow('→ Joining airdrop...'));
        const airdropResult = await bot.joinAirdrop();
        console.log(airdropResult.success ? 
            chalk.green('✔ Success') : 
            chalk.red('✖ Failed:'), airdropResult.success ? airdropResult.data.success : airdropResult.error);

        console.log(chalk.yellow('→ Getting quiz...'));
        const quizResult = await bot.getQuiz();
        console.log(quizResult.success ? 
            chalk.green('✔ Success') : 
            chalk.red('✖ Failed:'), quizResult.success ? `Question: ${quizResult.data.title}` : quizResult.error);

        console.log(chalk.yellow('→ Answering quiz...'));
        const answerResult = await bot.answerQuiz();
        console.log(answerResult.success ? 
            chalk.green('✔ Success') : 
            chalk.red('✖ Failed:'), answerResult.success ? answerResult.data.success : answerResult.error);

        console.log(chalk.yellow('→ Getting wallet info...'));
        const infoResult = await bot.getWalletInfo();
        console.log(infoResult.success ? 
            chalk.green('✔ Success') : 
            chalk.red('✖ Failed:'), infoResult.success ? 'Info retrieved' : infoResult.error);

        const walletData = {
            userId: walletResult.userId,
            token: walletResult.token,
            referralCode: refCode,
            proxy: proxy || 'No proxy',
            timestamp: new Date().toISOString()
        };
        await bot.saveWallet(walletData);
        wallets.push(walletData);

        await delay(1000);
    }

    console.log(chalk.cyan.bold('\n======================================='));
    console.log(chalk.cyan.bold('  Bot Completed - @itsmesatyavir     '));
    console.log(chalk.cyan.bold('======================================='));
    console.log(chalk.yellow(`Total wallets created: ${wallets.length}`));
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

rl.question(chalk.white('How many wallets to create? '), (answer) => {
    const count = parseInt(answer);
    if (isNaN(count) || count <= 0) {
        console.log(chalk.red('✖ Please enter a valid number greater than 0'));
        rl.close();
        return;
    }
    
    runBot(count).then(() => rl.close());
});
