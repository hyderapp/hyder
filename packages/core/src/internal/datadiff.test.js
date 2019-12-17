import { diff, patch } from './datadiff';


it('simple diff', () => {
  const pre = { name: 'bob', like: 'programming' };
  const cur = { name: 'eve', age: 12 };
  const pat = diff(pre, cur);
  expect(pat).toEqual([
    'batch',
    [
      ['set', { name: 'eve', age: 12 }],
      ['del', ['like']]
    ]
  ]);
  expect(patch(pre, pat)).toEqual(cur);
});


it('simple nested object', () => {
  const pre = {
    toast: null,
    pages: {
      layout: 'column',
      data: {
        name: 'studio',
        version: '1.2.0'
      }
    }
  };
  const cur = {
    ...pre,
    toast: 'not found'
  };

  const pat = diff(pre, cur);
  expect(pat).toEqual(['set', { toast: 'not found' }]);
  expect(patch(pre, pat)).toEqual(cur);

  const next = {
    ...cur,
    pages: {
      ...cur.pages,
      layout: 'row'
    }
  };

  const patn = diff(cur, next);
  expect(patn).toEqual([
    'setrec',
    {
      pages: ['set', { layout: 'row' }]
    }
  ]);
  expect(patch(cur, patn)).toEqual(next);
});


it('nested object more', () => {
  const pre = {
    toast: 'hello',
    page: {
      layout: { name: 'row', size: 100 },
      components: {
        A: {
          name: 'A',
          data: {
            value: 100
          }
        },
        B: {
          name: 'B',
          data: {
            value: 200
          }
        },
        C: {
          name: 'C',
          data: {
            value: 300
          }
        }
      }
    }
  };

  const cur = JSON.parse(JSON.stringify(pre));
  cur.page.components.B = {
    name: 'BB',
    version: '1.0',
    data: { value: 500 }
  };
  const pat = diff(pre, cur);
  expect(pat).toEqual([
    'setrec', {
      page: [
        'setrec', {
          components: [
            'setrec', {
              B: [
                'batch', [
                  ['set', { name: 'BB', version: '1.0' }],
                  ['setrec', {
                    data: [
                      'set', { value: 500 }
                    ]
                  }]
                ]
              ]
            }
          ]
        }
      ]
    }
  ]);
});


it('diff list: push items', () => {
  const pre = [
    { name: 'a', value: 1 },
    { name: 'b', value: 2 },
    { name: 'c', value: 3 },
    { name: 'd', value: 4 }
  ];
  const cur = [
    ...pre,
    { name: 'e', value: 5 }
  ];

  const pat = diff(pre, cur);
  expect(pat).toEqual(['list',
    [4, [], [{ name: 'e', value: 5 }]]
  ]);

  expect(patch(pre, pat)).toEqual(cur);
});


it('diff list: raw items', () => {
  const pre = ['1', '2', '3', '4'];
  const cur = ['1', '3', '3', '4', '5', '6'];
  const pat = diff(pre, cur);
  expect(pat).toEqual(['list',
    [
      4,
      [
        [1, ['return', '3']]
      ],
      ['5', '6']
    ]
  ]);
});


it('diff list: same item value, but diff reference', () => {
  const pre = [
    { name: 'a', value: 1 },
    { name: 'b', value: 2 }
  ];
  const cur = [
    { name: 'a', value: 1 },
    { name: 'b', value: 2 }
  ];
  expect(diff(pre, cur)).toEqual(['return', cur]);
});


it('diff list: update item', () => {
  const pre = [
    { name: 'A', data: { size: 100, like: true } },
    { name: 'B', data: { price: 100, image: 'logo.gif' } },
    { name: 'C', data: { version: '1.0' } },
    { name: 'D', data: { key: 'acde' } }
  ];
  const cur = [...pre];
  cur[2] = {
    ...pre[2],
    data: {
      ...pre[2].data,
      version: '2.0'
    }
  };

  const pat = diff(pre, cur);
  expect(pat).toEqual(['list',
    [
      // update size
      4,
      // update items
      [
        [2, // item index
          ['setrec', {
            data: ['set', { version: '2.0' }]
          }]
        ]
      ],
      [] // push items
    ]
  ]);
});


it('diff list: sort item', () => {
  const pre = [
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
    { name: 'D' }
  ];
  const cur = [...pre];
  [cur[1], cur[2]] = [cur[2], cur[1]];

  const pat = diff(pre, cur);
  // just update items, dont like virtualdom, use key for move
  expect(pat).toEqual(['list',
    [
      4,
      [
        [1, ['set', { name: 'C' }]],
        [2, ['set', { name: 'B' }]]
      ],
      []
    ]
  ]);
});


it('diff list: remove one item', () => {
  const pre = [
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
    { name: 'D' }
  ];
  const cur = pre.slice(1);
  const pat = diff(pre, cur);
  expect(pat).toEqual(['listdel', [0]]);
  expect(patch(pre, pat)).toEqual(cur);
});


it('real case test', () => {
  const pre = {
    toast: null,
    page: {
      config: {},
      widgets: [
        { name: 'TopHeader', data: {} },
        {
          name: 'StudioHeader',
          data: {
            follower: '1236',
            header: {
              avatar: 'logo.png',
              studioName: 'dream flower'
            },
            studioDsr: [
              { title: '守时', score: '3.5' },
              { title: '服务', score: '4' },
              { title: '技术', score: '5' }
            ]
          }
        },
        { name: 'StudioCommitment', data: {} },
        {
          name: 'FilterList',
          data: {
            headers: [
              { title: '所有作品', id: 'all' },
              { title: '评价', id: 'comments' },
              { title: '品牌介绍', id: 'info' }
            ]
          }
        },
        { name: 'StudioAnnouncement', data: {} }
      ]
    }
  };

  const widgets = [...pre.page.widgets];
  const widget = widgets[1];
  const businessCard = {
    artisan: { id: '55008...', nick: 'eve' },
    categories: ['beautify', 'real'],
    logo: 'logo.png',
    skill: '4.0'
  };
  widgets[1] = {
    ...widget,
    data: {
      ...widget.data,
      businessCard
    }
  };

  const cur = {
    toast: null,
    page: {
      config: {},
      widgets
    }
  };

  const pat = diff(pre, cur);
  expect(pat).toEqual(['setrec', {
    page: ['setrec', {
      widgets: ['list',
        [5,
          [
            [1,
              ['setrec', {
                data: ['set', { businessCard }]
              }]
            ]
          ],
          []
        ]
      ]
    }]
  }]);

  expect(patch(pre, pat)).toEqual(cur);
});
