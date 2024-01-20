import {  Injectable, Post} from "@nestjs/common";
import { Request } from 'express';
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";


@Injectable()

export class AuthService{
    constructor(private prisma: PrismaService){}



    signup(){
        return {msg: 'I have signed up'};
    }
    signin(){
        
        return {msg: 'I have signed in'};
    }

}
