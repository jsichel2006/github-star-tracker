import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Repository } from '../types';
import { RepoCard } from './RepoCard';

interface VirtualizedRepoListProps {
  repositories: Repository[];
}

interface ItemProps {
  index: number;
  style: React.CSSProperties;
}

export const VirtualizedRepoList: React.FC<VirtualizedRepoListProps> = ({ repositories }) => {
  const Item: React.FC<ItemProps> = ({ index, style }) => (
    <div style={style} className="px-4 py-2">
      <RepoCard repo={repositories[index]} />
    </div>
  );

  return (
    <div className="w-full">
      <List
        height={600}
        width="100%"
        itemCount={repositories.length}
        itemSize={140}
        className="w-full"
      >
        {Item}
      </List>
    </div>
  );
};