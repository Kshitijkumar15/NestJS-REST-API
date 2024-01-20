import { ForbiddenException, Injectable, Post } from "@nestjs/common";
import { AuthDto } from "./dto";
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { error } from "console";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()

export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
    ) { }

    async signup(dto: AuthDto) {
        //generate the password hash
        const hash = await argon.hash(dto.password);
        // save new user in db
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
                },
            });

            delete user.hash;

            //return thee saved user
            return this.signToken(user.id, user.email);
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException(
                        'credentials taken'
                    );
                }
            }
            throw error;
        }

    }
    async signin(dto: AuthDto) {
        //find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        //if user doesn't exist throw exception
        if (!user) throw new ForbiddenException(
            'credentials incorrect',
        );
        //compare password
        const pwMathes = await argon.verify(
            user.hash,
            dto.password,
        );
        //if password incorrect throw exception
        if (!pwMathes)
            throw new ForbiddenException(
                'credentials incorrect',
            );
        //send back the user
        return this.signToken(user.id, user.email);
    }

    async signToken(userId: number, email: string): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            email,
        };
        const secret = this.config.get('JWT_SECRET');

        const token = await this.jwt.signAsync(
            payload, {
            expiresIn: '15m',
            secret: secret,
        },
        );

        return {
            access_token: token,
        };

    }
}
