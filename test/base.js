const test = require('ava');
const io = require('socket.io-client');
const broker = require('./helpers/service-broker');

test.before(async t => {
    await broker.start();
    let socket = io('http://localhost:3000');
    t.context.socket = socket;
    t.context.call = function (action, params) {
        return new Promise(function (resolve, reject) {
            socket.emit('call', action, params, function (err, res) {
                if (err) {
                    const e = new Error(err.message);
                    e.name = err.name;
                    e.code = err.code;
                    e.type = err.type;
                    return reject(e);
                }
                resolve(res);
            });
        });
    };
});

test.after(async t => {
    await broker.stop();
});

test('call published actions', async t => {
    let res = await t.context.call('math.add', { a: 1, b: 2 });
    t.true(res === 3);
});

test('action name not string', async t => {
    await t.throwsAsync(() => t.context.call(222, 'wtf'), { name: 'BadRequestError', message: 'Bad Request' });
});
