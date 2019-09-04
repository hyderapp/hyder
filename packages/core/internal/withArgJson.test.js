import withArgJson from './withArgJson';


it('parse json if necessary', () => {
  const loadData = (data, text) => {
    expect(typeof data).toBe('object');
    expect(typeof text).toBe('string');
  };

  withArgJson(loadData)(JSON.stringify({ success: true, data: [1, 2, 3] }), 'Hello World');
  withArgJson(loadData)(JSON.stringify([1, 2, 3]), 'some text');
});
