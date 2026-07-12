import assert from 'node:assert'
import { buildWhatsappOrderUrl } from './src/lib/whatsapp.js'
import { searchProducts, sortProducts } from './src/lib/products.js'
import { formatPrice, slugify } from './src/lib/format.js'
import { BUSINESS } from './src/lib/config.js'

const p = { name: 'Human Skull Model', slug: 'human-skull-model', price: 1200 }
const url = buildWhatsappOrderUrl(p)
assert.ok(url.startsWith(`https://wa.me/${BUSINESS.whatsappNumber}?text=`), 'wa.me base')
const text = decodeURIComponent(url.split('text=')[1])
assert.ok(text.includes('প্রোডাক্ট: Human Skull Model'), 'bangla product')
assert.ok(text.includes('মূল্য: ৳1,200'), 'price line')
assert.ok(!url.includes(' '), 'no raw spaces')

const sample = [
  { id:'1', name:'Skull', description:'anatomy', category:'bone-models', tags:['skull'], price:1200, created_at:'2026-01-01' },
  { id:'2', name:'Keyring', description:'gift', category:'keyrings', tags:['name'], price:150, created_at:'2026-02-01' },
  { id:'3', name:'Planter', description:'decor', category:'home-decor', tags:['plant'], price:450, created_at:'2026-03-01' },
]
assert.equal(searchProducts(sample,'skull').length, 1, 'search name')
assert.equal(searchProducts(sample,'keyrings')[0].id, '2', 'search category')
assert.deepEqual(sortProducts(sample,'price-asc').map(x=>x.price), [150,450,1200], 'sort asc')
assert.deepEqual(sortProducts(sample,'price-desc').map(x=>x.price), [1200,450,150], 'sort desc')
assert.equal(sortProducts(sample,'newest')[0].id, '3', 'sort newest')
assert.equal(formatPrice(1200), '৳1,200', 'price fmt')
assert.equal(slugify('Human Skull Model!'), 'human-skull-model', 'slugify')

console.log('ALL LOGIC CHECKS PASSED')
