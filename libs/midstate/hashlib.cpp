
#include <v8.h>
#include <node_buffer.h>
#include <cstdlib>
#include <sstream>
#include <iostream>
#include <cstring>
using namespace std;
using namespace v8;

#define get_data(POS, DATA, LENGTH) \
  String::Utf8Value mdata_##POS (args[POS]->ToString()); \
  Local<Object> buffer_obj_##POS; \
  if (node::Buffer::HasInstance(args[POS])) { \
    Local<Object> buffer_obj_##POS = args[POS]->ToObject(); \
    LENGTH = node::Buffer::Length(buffer_obj_##POS); \
    DATA = (unsigned char *)node::Buffer::Data(buffer_obj_##POS); \
  } else { \
    LENGTH = (size_t)mdata_##POS.length(); \
    DATA = (unsigned char *)*mdata_##POS; \
  }


typedef union sha256_state_t sha256_state_t;
union sha256_state_t {
  uint32_t      h[8];
  unsigned char byte[32];
};

static uint32_t h[] = {
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
};

static uint32_t k[] = {
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
};

static inline uint32_t ror32(const uint32_t v, const uint32_t n) {
  return (v >> n) | (v << (32 - n));
};

static inline void update_state(sha256_state_t *state, const uint32_t data[16]) {
  uint32_t w[64];
  sha256_state_t t = *state;

  for (size_t i = 0 ; i < 16; i++) {
    w[i] = htonl(data[i]);
  }

  for (size_t i = 16; i < 64; i++) {
    uint32_t s0 = ror32(w[i - 15], 7) ^ ror32(w[i - 15], 18) ^ (w[i - 15] >> 3);
    uint32_t s1 = ror32(w[i - 2], 17) ^ ror32(w[i -  2], 19) ^ (w[i -  2] >> 10);
    w[i] = w[i - 16] + s0 + w[i - 7] + s1;
  }

  for (size_t i = 0; i < 64; i++) {
    uint32_t s0  = ror32(t.h[0], 2) ^ ror32(t.h[0], 13) ^ ror32(t.h[0], 22);
    uint32_t maj = (t.h[0] & t.h[1]) ^ (t.h[0] & t.h[2]) ^ (t.h[1] & t.h[2]);
    uint32_t t2  = s0 + maj;
    uint32_t s1  = ror32(t.h[4], 6) ^ ror32(t.h[4], 11) ^ ror32(t.h[4], 25);
    uint32_t ch  = (t.h[4] & t.h[5]) ^ (~t.h[4] & t.h[6]);
    uint32_t t1  = t.h[7] + s1 + ch + k[i] + w[i];

    t.h[7] = t.h[6];
    t.h[6] = t.h[5];
    t.h[5] = t.h[4];
    t.h[4] = t.h[3] + t1;
    t.h[3] = t.h[2];
    t.h[2] = t.h[1];
    t.h[1] = t.h[0];
    t.h[0] = t1 + t2;
  }

  for (size_t i = 0; i < 8; i++) {
    state->h[i] += t.h[i];
  }
}

static inline void init_state(sha256_state_t *state) {
  for (size_t i = 0; i < 8; i++) {
    state->h[i] = h[i];
  }
}

static sha256_state_t midstate(const unsigned char data[128]) {
  sha256_state_t state;

  init_state(&state);
  
  uint32_t mstate_data[16];

  for(int i=0;i<16;i++) {
    uint32_t temp;
    char byte[9];
    memcpy(byte,data+i*8,8);
    byte[8]='\0';
    std::stringstream ss;
    ss << std::hex << byte;
    ss >> temp;
    mstate_data[i] = temp;
  }  

  update_state(&state, mstate_data);
  return state;
}


static void to_hex(unsigned char *hex, unsigned char *str, int len)
{
  static const char hexits[17] = "0123456789abcdef";
  int i;

  for (i = 0; i < len; i++) {
    hex[i * 2] = hexits[str[i] >> 4];
    hex[(i * 2) + 1] = hexits[str[i] &  0x0F];
  }
  hex[len * 2] = '\0';
}


Handle<Value>
midstate(const Arguments& args)
{
  HandleScope scope;

  size_t length;
  unsigned char *data;
  get_data(0, data, length);

  sha256_state_t mstate;

  unsigned char hex_digest[64];
  unsigned char digest[32];

  mstate = midstate(data);

  digest[ 3] = (unsigned char) ((mstate.h[0] >> 24) & 0xff);
  digest[ 2] = (unsigned char) ((mstate.h[0] >> 16) & 0xff);
  digest[ 1] = (unsigned char) ((mstate.h[0] >>  8) & 0xff);
  digest[ 0] = (unsigned char) ((mstate.h[0]      ) & 0xff);
  digest[ 7] = (unsigned char) ((mstate.h[1] >> 24) & 0xff);
  digest[ 6] = (unsigned char) ((mstate.h[1] >> 16) & 0xff);
  digest[ 5] = (unsigned char) ((mstate.h[1] >>  8) & 0xff);
  digest[ 4] = (unsigned char) ((mstate.h[1]      ) & 0xff);
  digest[11] = (unsigned char) ((mstate.h[2] >> 24) & 0xff);
  digest[10] = (unsigned char) ((mstate.h[2] >> 16) & 0xff);
  digest[ 9] = (unsigned char) ((mstate.h[2] >>  8) & 0xff);
  digest[ 8] = (unsigned char) ((mstate.h[2]      ) & 0xff);
  digest[15] = (unsigned char) ((mstate.h[3] >> 24) & 0xff);
  digest[14] = (unsigned char) ((mstate.h[3] >> 16) & 0xff);
  digest[13] = (unsigned char) ((mstate.h[3] >>  8) & 0xff);
  digest[12] = (unsigned char) ((mstate.h[3]     ) & 0xff);
  digest[19] = (unsigned char) ((mstate.h[4] >> 24) & 0xff);
  digest[18] = (unsigned char) ((mstate.h[4] >> 16) & 0xff);
  digest[17] = (unsigned char) ((mstate.h[4] >>  8) & 0xff);
  digest[16] = (unsigned char) ((mstate.h[4]      ) & 0xff);
  digest[23] = (unsigned char) ((mstate.h[5] >> 24) & 0xff);
  digest[22] = (unsigned char) ((mstate.h[5] >> 16) & 0xff);
  digest[21] = (unsigned char) ((mstate.h[5] >>  8) & 0xff);
  digest[20] = (unsigned char) ((mstate.h[5]      ) & 0xff);
  digest[27] = (unsigned char) ((mstate.h[6] >> 24) & 0xff);
  digest[26] = (unsigned char) ((mstate.h[6] >> 16) & 0xff);
  digest[25] = (unsigned char) ((mstate.h[6] >>  8) & 0xff);
  digest[24] = (unsigned char) ((mstate.h[6]      ) & 0xff);
  digest[31] = (unsigned char) ((mstate.h[7] >> 24) & 0xff);
  digest[30] = (unsigned char) ((mstate.h[7] >> 16) & 0xff);
  digest[29] = (unsigned char) ((mstate.h[7] >>  8) & 0xff);
  digest[28] = (unsigned char) ((mstate.h[7]      ) & 0xff);
  
  to_hex(hex_digest,digest,32);

  return scope.Close(String::New((char*)hex_digest,64));
}

void init(Handle<Object> exports) {
  exports->Set(String::NewSymbol("midstate"),
	       FunctionTemplate::New(midstate)->GetFunction());
}

NODE_MODULE(hashlib, init)
