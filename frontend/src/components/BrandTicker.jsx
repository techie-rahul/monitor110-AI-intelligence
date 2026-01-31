/**
 * BrandTicker Component
 * Auto-scrolling horizontal marquee showing major brands/sectors
 */

const BRANDS = [
    { name: 'Apple', icon: '' },
    { name: 'Microsoft', icon: '' },
    { name: 'NVIDIA', icon: '' },
    { name: 'Tesla', icon: '' },
    { name: 'Google', icon: '' },
    { name: 'Amazon', icon: '' },
    { name: 'Meta', icon: '' },
    { name: 'Bitcoin', icon: '₿' },
    { name: 'Ethereum', icon: 'Ξ' },
    { name: 'Indian Market', icon: '₹' },
    { name: 'EV Sector', icon: '⚡' },
];

export default function BrandTicker() {
    // Duplicate brands for seamless loop
    const tickerItems = [...BRANDS, ...BRANDS];

    return (
        <div className="brand-ticker">
            <div className="brand-ticker-track">
                {tickerItems.map((brand, index) => (
                    <span key={index} className="brand-ticker-item">
                        {brand.icon && <span className="brand-icon">{brand.icon}</span>}
                        {brand.name}
                    </span>
                ))}
            </div>
        </div>
    );
}
