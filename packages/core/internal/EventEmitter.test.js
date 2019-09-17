import EventEmitter from './EventEmitter';


describe('Event', () => {
  it('test', () => {
    const f1 = jest.fn();
    const f2 = jest.fn();
    const f3 = jest.fn();
    const f4 = jest.fn();
    const event = new EventEmitter();
    event.on('a', f1);
    event.on('a', f2);
    event.on('b', f3);
    event.on('d', f4);

    event.emit('a', [1, 2, 3]);
    expect(f1.mock.calls.length).toBe(1);
    expect(f1.mock.calls[0][0]).toEqual([1, 2, 3]);

    expect(f3.mock.calls.length).toBe(0);
  });
});
