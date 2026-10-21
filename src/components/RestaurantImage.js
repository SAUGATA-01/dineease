export default function RestaurantImage({ url, name, className = "" }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className={`object-cover ${className}`} />
    );
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 text-5xl ${className}`}>
      🍽️
    </div>
  );
}