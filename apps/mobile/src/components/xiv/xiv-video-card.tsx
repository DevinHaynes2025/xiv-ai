import { XivContentCard, type XivContentCardProps } from './content-card';

type Props = Omit<XivContentCardProps, 'kind'>;

export function XivVideoCard(props: Props) {
  return <XivContentCard {...props} kind="video" />;
}
