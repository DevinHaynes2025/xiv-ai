import { XivContentCard, type XivContentCardProps } from './content-card';

type Props = Omit<XivContentCardProps, 'kind'>;

export function XivArticleCard(props: Props) {
  return <XivContentCard {...props} kind="article" />;
}
