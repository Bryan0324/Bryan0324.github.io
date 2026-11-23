---
title: Company Queries I & II - 面試練習 day2
date: 2026-10-29
tags: [競程, 倍增, LCA]
categories: [競程]
---

直入主題 [題目連結](https://cses.fi/problemset/task/1688/)

# 題序
純粹的 LCA

# 解
```cpp
#include <bits/stdc++.h>

using namespace std;

typedef unsigned long long ull;
typedef long long ll;

int main()
{
    cin.tie(0)->sync_with_stdio(false);
    int n, q;
    cin >> n >> q;

    vector<vector<int>> graph(n);
    vector<vector<int>> to_next(n, vector<int>(__lg(n)+1, -2));
    vector<int> h(n);
    for(int i = 1; i < n; i++)
    {
        int e;
        cin >> e; e--;
        to_next[i][0] = e;
        graph[e].push_back(i);
    }

    queue<pair<int, int>> bfs;
    bfs.push({0, 0});
    while(!bfs.empty())
    {
        auto &[deep, now] = bfs.front();
        h[now] = deep;
        for(auto &i : graph[now])
        {
            bfs.push({deep+1, i});
        }
        bfs.pop();
    }

    for(int l = 1; l <= __lg(n); l++)
    {
        for(int i = 0; i < n; i++)
        {
            if(to_next[i][l-1] != -2)
                to_next[i][l] = to_next[to_next[i][l-1]][l-1];
        }
    }

    while(q--)
    {
        int a, b;
        cin >> a >> b;
        a--; b--;
        if(h[a] < h[b])swap(a, b);

        while(h[a] > h[b])
        {
            a = to_next[a][__lg(h[a]-h[b])];
        }

        while(to_next[a][0] != to_next[b][0])
        {
            for(int i = 1; i <= __lg(n); i++)
            {
                if(to_next[a][i] == to_next[b][i])
                {
                    a = to_next[a][i-1];
                    b = to_next[b][i-1];
                    break;
                }
            }
        }
        if(a == b)cout << a+1;
        else cout << to_next[a][0]+1;
        cout << '\n';
    }
}
```
不過這樣寫會是$ O(n log^2(n)) $
其中
```cpp
while(to_next[a][0] != to_next[b][0])
{
    for(int i = 1; i <= __lg(n); i++)
    {
        if(to_next[a][i] == to_next[b][i])
        {
            a = to_next[a][i-1];
            b = to_next[b][i-1];
            break;
        }
    }
}
```
改成
```cpp
for(int i = __lg(n); i >= 1 ; i--)
{
    if(to_next[a][i] != to_next[b][i])
    {
        a = to_next[a][i];
        b = to_next[b][i];
    }
}
```
因為不可能重複跳
(假設重複跳兩次 $2^i$ 那在這之前的 $2^(i+1)$ 就應該跳了 故不可能重複跳或回去跳比較多的距離)
