import React from 'react'
import { heroImage } from '../assets'
import Image from 'next/image'

const Hero = () => {
  return (
    <div className="relative w-full h-screen">
      <Image
        src={heroImage}
        alt="Hero background"
        fill
        priority
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 flex justify-center px-4">
        <div className="text-white text-center relative top-20">

          {/* GROVE */}
          <h1 className="
            flex items-baseline justify-center
            font-extrabold tracking-tight leading-none
            text-[56px] sm:text-[80px] lg:text-[150px]
          ">
            GR
            <span
              aria-hidden
              className="
                inline-block
                w-[70px] h-[36px]
                sm:w-[110px] sm:h-[55px]
                lg:w-[180px] lg:h-[110px]
                border-[5px] sm:border-[7px] lg:border-[25px]
                border-white rounded-full
              "
            />
            VE
          </h1>

          {/* CONNECT */}
          <h2 className="
            font-bold tracking-tight leading-none
            text-[20px] sm:text-[28px] lg:text-[150px]
          ">
            CONNECT
          </h2>
        </div>
      </div>

      {/* Image Cards */}
      <div className="
        absolute bottom-5 left-1/2 -translate-x-1/2
        hidden lg:flex items-center gap-8
      ">
        <Image
          src={heroImage}
          alt="Hero decoration"
          width={300}
          height={300}
          className="rounded-2xl"
        />
        <Image
          src={heroImage}
          alt="Hero decoration"
          width={300}
          height={300}
          className="rounded-2xl"
        />
      </div>
    </div>
  )
}

export default Hero
